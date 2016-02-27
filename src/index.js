/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*global $:false, BUFFERSIZE */

'use strict';

var models = require('./data/models.json').models;
var utils = require('./utils');
utils.initPubSub();
var initViews = require('./views').initViews;
var showerror = require('./views/showerror');
var showError = showerror.showError;
var getModels = require('./models').getModels;
var Firebase = require("firebase");
var myDataRef = new Firebase('https://texttyper.firebaseio.com/');

window.BUFFERSIZE = 8192;

var sessionName = window.prompt("Session Name","");
exports.getSessionName = function(){
  return sessionName;
};

$(document).ready(function() {
  var tokenGenerator = utils.createTokenGenerator();

  myDataRef.child(sessionName).child('transcript').on("value", function(snapshot) {
    if(snapshot.val()) {
      
        // store current positions in variables
        var start = document.getElementById("edittedText").selectionStart,
        end = document.getElementById("edittedText").selectionEnd;

        $('#edittedText').val($('#edittedText').val() + snapshot.val());

        // restore from variables...
        document.getElementById("edittedText").setSelectionRange(start, end);
    }
  });

  $( "#edittedText" ).on('change keyup paste', function() {
    myDataRef.child(sessionName).set({
      editted: $("#edittedText").val()
    });    
  });

  myDataRef.child(sessionName).child('editted').on("value", function(snapshot) {
    if(snapshot.val()) {
      
      // store current positions in variables
      var start = document.getElementById("edittedText").selectionStart,
      end = document.getElementById("edittedText").selectionEnd;

      $('#edittedText').val(snapshot.val());

      // restore from variables...
      document.getElementById("edittedText").setSelectionRange(start, end);    
    }
  });  

  myDataRef.child(sessionName).set({
    transcript: '',
    editted: ''
  });
  exports.dataRef = myDataRef;

  // Make call to API to try and get token
  tokenGenerator.getToken(function(err, token) {
    window.onbeforeunload = function() {
      localStorage.clear();
    };

    if (!token) {
      console.error('No authorization token available');
      console.error('Attempting to reconnect...');

      if (err && err.code)
        showError('Server error ' + err.code + ': '+ err.error);
      else
        showError('Server error ' + err.code + ': please refresh your browser and try again');
    }

    var viewContext = {
      currentModel: 'en-US_BroadbandModel',
      models: models,
      token: token,
      bufferSize: BUFFERSIZE
    };

    initViews(viewContext);

    // Save models to localstorage
    localStorage.setItem('models', JSON.stringify(models));
    
    //Check if playback functionality is invoked
    localStorage.setItem('playbackON', false);
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for(var i=0; i< vars.length; i++) {
      var pair = vars[i].split('=');
      if(decodeURIComponent(pair[0]) === 'debug') {   
        localStorage.setItem('playbackON',decodeURIComponent(pair[1]));
      }
    }

    // Set default current model
    localStorage.setItem('currentModel', 'en-US_BroadbandModel');
    localStorage.setItem('sessionPermissions', 'true');
    
    getModels(token);
    
    $.subscribe('clearscreen', function() {
      $('#resultsText').text('');
      $('#resultsJSON').text('');
      $('.error-row').hide();
      $('.notification-row').hide();
      $('.hypotheses > ul').empty();
      $('#metadataTableBody').empty();
    });

  });

});
