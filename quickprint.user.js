// ==UserScript==
// @name                Colleague Quickprint
// @author              cabrito
// @namespace           https://github.com/cabrito
// @description         Removes the requirement of Colleague UI to go through Adobe Reader to print.
// @version             1.8RC
// @include             https://*.edu*/UI/home/*
// @require             https://code.jquery.com/jquery-3.4.1.min.js
// @grant               GM_info
// @grant               GM.getValue
// @grant               GM.setValue
// ==/UserScript==

// For compatibility and security, we use an IIFE (Immediately invoked function expression)
(function() {
    "use strict";   // Makes the code "safer" to prevent us from using undeclared variables.

    /**
     *  The core of the logic to make appropriate changes to the document.
     */
    var observer = new MutationObserver(function (mutations, mi) {
      	quickprintLogic();
    });

    //////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                          //
    //                                      Colleague Functions                                 //
    //          All functions here should apply to Colleague (exclusively, if possible)         //
    //  Most of the code here is "existence-based", in that it will only execute if the given   //
    //                                     elements exist.                                      //
    //                                                                                          //
    //////////////////////////////////////////////////////////////////////////////////////////////

    function quickprintLogic()
    {
        // If the Print Remote button exists, remove it and adjust the Save As dialog to say Quick Print.
        if ($("#reportPrint").length)
        {
            $("#reportPrint").remove();
            $("#reportSaveAs").text("Quickprint");
        }

        // Create new functionality for the big Download button.
        if ($("#fileDownloadBtn").length)
        {
            // Exists solely to communicate with the Autoregform.js script.
            // Intended to prevent this script from executing if the regform data
            // was sent over from Student Planner.
            var regformDataAvailable = $("#report-browser-pre-text").attr("regform");
            if (typeof regformDataAvailable === "undefined")
            {
                var url = $("#fileDownloadBtn").attr("href");

                // Only make a new button if we're in the 'Save As' dialog.
                if (!hasFileExt(url))
                {
                    var adjustedBtn = $cloneBtn($("#fileDownloadBtn"))
                                                .attr("id", "quickprint")
                                                .attr("type", "button");
                    $(adjustedBtn).text("Quickprint");
                    $("#fileDownloadBtn").replaceWith(adjustedBtn);
                    adjustedBtn.on("click", function () {
                        quickPrint(url);
                    });

                    // PRINT IMMEDIATELY!!! The button solely exists as a failsafe.
                    quickPrint(url);
                }
            }
        }

        // Remove the data window(s) when we're done.
      	if ($("#btn_close_report_browser").length)
        {
          	$("#btn_close_report_browser").on("click", function () {
                cleanUp();
            });
        }
    }

    /**
     *  Heart of the logic for printing data from the Colleague server. Does so by
     *  downloading data via a given URL and putting it into an iframe and calling
     *  the browser's print() function.
     *  @param fileUrl  A URL provided as a string.
     */
    function quickPrint(fileUrl)
    {
        // In case we have some residual window, clean it up!
        cleanUp();

        // Make the iframe...
        $("<iframe>", {
            id:  "dataWindow",
            frameborder: 0
        }).appendTo("body");
        var iframe = $("#dataWindow");

        // Get the data...
        $.get(fileUrl, function(data)
        {
            // Put the data into the iframe. Thankfully, <pre> is available for displaying fixed-width text data.
            $("<pre>", {
                id:  "textData",
                style: "border: none",
            }).appendTo($(iframe).contents().find("body"));

            // The "replace" here trims the END of the string to prevent "blank" 2nd pages from printing
            var formData = formatData(data).replace(/\s*$/, "");

            $(iframe).contents().find("#textData").text(formData);
        }, 'text').done(function() {
            $(iframe).ready(function() {
                $(iframe).get(0).contentWindow.print();
            });
        }).fail(function() {
            alert("ERROR: Colleague failed to provide data to us. Please log out and try again.");
        });;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                          //
    //                                  Utility Functions                                       //
    //            Small code snippets that are vital, but hidden to prevent confusion           //
    //                                                                                          //
    //////////////////////////////////////////////////////////////////////////////////////////////

    /**
     *  Decides whether or not the url has a file extension
     *  @param  url A URL provided as a string.
     *  @return     boolean
     */
    function hasFileExt(url)
    {
        var filename = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('?'));
        return filename.lastIndexOf('.') >= 0;
    }

    /**
     *	Fixes the problem encountered when the AUX code prints at the top of RGN statements.
     *	@param	data	Text data provided from Colleague
     *	@return				Either the same input text, or all the text after the first pagebreak.
     */
    function formatData(data)
    {
      	// Uses regexp to remove all whitespace characters globally in the data.
        var newStr = data.replace(/\s/g, '');

      	// In RGN statements, the first non-whitespace character is "#". We skip everything until the first pagebreak \f
        if (newStr.charAt(0) !== "#")
        {
            return data;
        } else {
            return data.substring(data.indexOf("\f"));
        }
    }

    /**
     *  Removes the hidden iframe window we may create.
     */
    function cleanUp()
    {
        if ($("#dataWindow").length)
            $("#dataWindow").remove();
    }

    /**
     *  Clones the given button
     *  @param $btn A jQuery object containing a button
     *  @return     Cloned button
     */
    function $cloneBtn($btn)
    {
        var $adjustedBtn = $btn.clone()
                                .off()
                                .attr("href", null)
                                .removeAttr("data-bind");   // Student Planner places the click event in data-bind
        return $adjustedBtn;
    }

    /* Begin document observation */
    observer.observe(document,	{
        childList: true,
        subtree: true
    });
}());
