/* Takes in a 2-level hierarchical set of data, and renders a series of divs
showing all of the measures sized proportinally to each other based on their 
value compared to the grand total. This ensures that the largest spending item
will have the largest font.
*/

//Pseudo code

//Read the json data file
//http://api.jquery.com/jQuery.getJSON/


function getRootElement() {
    return $("#list-container");
}

function getResizeElements(rootElement) {
    return rootElement.find(".o-measure");
}



function readData(callback) {
   $.getJSON("./data/sampleData.json")
   .done(function(results) {
       callback(results);
   })
   .fail(function (jqxhr, textStatus, error) {
       output("Had a problem getting the data: " + error);
   });
}

//Set some options specifying the L1, L2, measure, and total columns
function getOptions() {
    // hard-coded
    // TODO: make these read from some input
    var options = {
            L1: "program",
            L2: "key",
            measure: "value"
        };
    return options;
}

// master function to begin after data retrieval
function processData(data) {
    var options = getOptions();
    var structured = structureData(data, options);
    var sorted = sortData(structured);
    var subTotaled = subTotalData(sorted);
    var rootElement = getRootElement();
    
    rootElement = renderList(rootElement, subTotaled);
    resizeList();
}

// Create a new array of elements with L1, L2, measure structure
function structureData(data, options) {
    // get only the attributes you need
    var l1Key = options.L1;
    var l2Key = options.L2;
    var measureKey = options.measure;
    
    var structuredData = data.map(function (element) {
       var l1 = element.hasOwnProperty(l1Key) ? element[l1Key] : null;
       var l2 = element.hasOwnProperty(l2Key) ? element[l2Key] : null;
        var measure = element.hasOwnProperty(measureKey) ? parseFloat(element[measureKey]): null;
        
        return {
            L1: l1.toString().toLowerCase(),
            L2: l2.toString().toLowerCase(),
            measure: measure
        };
    });

    return structuredData;
}

// Sort data by L1 ASC, measure DESC
// assumes the data is already structured with L1, L2 & measure
function sortData(data) {   
    var sortedData = data.sort(function(a, b) {
        // compare L1 first, then measure descending
        if (a.L1 < b.L1) {
            return -1;
        }
        else if (a.L1 > b.L1) {
            return 1;
        }
        else {                            // a.L1 == b.L1
            return b.measure - a.measure; // descending order
        }
    });
    
    return sortedData;
}

// calculates the total at the L1 group level
// adds a new attribute to each element called "subtotal"
function subTotalData(data) {
    subTotals = {};
    for ( i = 0; i < data.length; i++) {
        var key = data[i].L1;
        var value = data[i].measure;
        
        if(!subTotals.hasOwnProperty(key))
            subTotals[key] = 0;
        subTotals[key] += value;
    }
    
    // apply subtotals to each element
    var subTotaled = data.map(function (element) {
       element.l1SubTotal = subTotals[element.L1];
        return element; 
    });
    
    return subTotaled;
}

//Render the elements in the data as a series of divs with the 'o-row' class applied
function renderList(rootElement, data) {
    data.forEach(function (element) {
        rowDiv = $("<div class='o-row'></div>");
        rowDiv.className = "o-row";
        rowDiv.id = element.L2;

        spanMeasure = $("<span class='o-measure'></span>");
        spanMeasure.append("<span class='o-cash'>$</span");
        spanMeasure.append("<span class='o-value'>" + element.measure.toLocaleString() + "</span>");

        spanDetail = $("<span class='o-detail'></span>");
        spanDetail.append("<p class='o-l1'>" + element.L1 + "</p>");
        spanDetail.append("<p class='o-l2'>" + element.L2 + "</p>");
        spanDetail.append("<p class='o-total'>Total: $" + element.l1SubTotal.toLocaleString() + "</p>");
        
        rowDiv.append(spanMeasure);
        rowDiv.append(spanDetail);
        rootElement.append(rowDiv); 
    });    

    return rootElement;
}

// Resize the list based on window size
function resizeList() {
    rootElement = getRootElement();
    elementsToResize = getResizeElements(rootElement);
    
    var maxWidth = 1800;
    var defaultScaler = 10.5; //scaler - multiplication factor for fonts
    var minScaler = 2.2;

    
    var newWidth = Math.min($(window).width(), maxWidth); // sets max for width calc
    var scaler = Math.max(defaultScaler * newWidth / maxWidth, minScaler); // min scale
    
    elementsToResize.each(function(k,v) {
        var valSpan = $(v).children('.o-value')[0];
        var value = $(valSpan).text();
        var fontSize = getFontSize(value, scaler);
        $(v).css('font-size', fontSize + 'px');
    });
    
}

function getFontSize(val, scaler) {
    var minSize = 11; // minimum font size
    

    var pc = String(val);
    var str = pc.replace(',', ''); // "100.01"
    var val = Number(str); // 100.01
    var roundNum = Math.round(val);
    var periodCount = (str.match(/\./g) || []).length;
    var numeralCount = (str.match(/[0-9]/g) || []).length;
    var nonNumerals = Math.floor((String(roundNum).length-1) / 3) + periodCount; // count of periods and commas

    var size = Math.sqrt((val) / (.7*( (.56 * numeralCount) + (.27*nonNumerals) ))); // font size function
    var fontSize = scaler * size;
          
    return Math.max(fontSize, minSize);
    
}



// helpers
function output(message) {
  alert(message);  
}
// run on load
$(function () {
    // find root element
    // TODO: make root element dynamic
    readData(processData);
    // resize fonts when window resizes
    $(window).resize($.debounce(250, resizeList));
});






/*
Source: New York Times
Credit: https://www.nytimes.com/interactive/2014/01/19/us/budget-proposal.html

 var $values = $('.g-percapita');
        var defaultWidth = 1800;
        var defaultScaler = 10.5;
        var minScaler = 2.2;
        var scaler = defaultScaler;
        var minSize = 11;
          
          // size fonts
          hitBreakpoint();
          
        
        // resize fonts
        function hitBreakpoint() {
          var newWidth = $(window).width() > defaultWidth ? defaultWidth : $(window).width();
          $values.each(function(k,v) {
            scaler = defaultScaler * newWidth / defaultWidth;
            scaler = scaler < minScaler ? minScaler : scaler;
            var fontSize = getFontSize($(v).data('value'));
            $(v).css('font-size', fontSize + 'px');
          })
        }
        
        // copied from render-template
        function getFontSize(val) {
          var pc = String(Math.round(val));
          var str = String(pc); // "230.01"
          var val = Number(pc); // 230.01
          var periods = str.indexOf('.') !== -1 ? 1 : 0; // count of periods
          var numerals = str.replace('.','').length; // number of numerals
          var roundNum = Math.round(val); // non-decimal number: 230
          var nonNumerals = Math.floor((String(roundNum).length-1) / 3) + periods; // count of periods and commas
          
          var size = Math.sqrt((val) / (.7*( (.56*numerals) + (.27*nonNumerals) ))); // font size function
          var fontSize = scaler * size;
          
          return fontSize < minSize ? minSize : fontSize;
        }
        
        //PageManager.on("nyt:page-breakpoint", hitBreakpoint);
        $(window).on('resize', _.debounce(hitBreakpoint));
        */