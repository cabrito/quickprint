// ==UserScript==
// @name     			Colleague Quickprint
// @author			cabrito
// @description 		Removes the requirement of Colleague UI to go through Adobe Reader to print.
// @version  			1.1
// @include  			https://*.edu/UI/home/*
// @require 			https://code.jquery.com/jquery-2.2.4.min.js
// @grant    			none
// ==/UserScript==

/**
 *  The core of the logic to make appropriate changes to the document.
 */
var observer = new MutationObserver(
function (mutations, mi)
{
    // If the Print Remote button exists, remove it and adjust the Save As dialog to say Quick Print.
    if ($("#reportPrint").length > 0)
    {
        $("#reportPrint").remove();
        $("#reportSaveAs").text("Quick Print");
    }

    // Create new functionality for the big Download button.
    if ($("#fileDownloadBtn").length > 0)
    {
        var url = $("#fileDownloadBtn").attr("href");

        // Only make a new button if we're in the 'Save As' dialog.
        if (!isPdf(url))
        {
            var adjustedBtn = $("#fileDownloadBtn").clone()
                                        .attr("id", "quickPrint")
                                        .attr("href", null)
                                        .attr("class", "esg-button-style esg-button esg-button--primary")
                                        .attr("type", "button");
            $(adjustedBtn).text("Quick Print");
            $("#fileDownloadBtn").replaceWith(adjustedBtn);
            adjustedBtn.on("click", function () { quickPrint(url); });

            // PRINT IMMEDIATELY!!! The button solely exists as a failsafe.
            quickPrint(url);
        }
    }

    // Remove the data window(s) when we're done.
    if ($("#fileCloseBtn").length > 0)
    {
        $("#fileCloseBtn").on("click", function ()
                                        {
                                            if ($("#dataWindow").length > 0)
                                            {
                                                $("#dataWindow").remove();
                                            }
                                        });
    }
});

/**
 *  Heart of the logic for printing data from the Colleague server. Does so by
 *  downloading data via a given URL and putting it into an iframe and calling
 *  the browser's print() function.
 *  @param fileUrl  A URL provided as a string.
 */
function quickPrint(fileUrl)
{
    // Make the iframe...
    $("<iframe>", {
        id:  "dataWindow",
        frameborder: 0
    }).appendTo("body");
    var iframe = $("#dataWindow");

    // Get the data...
    $.get(fileUrl, function(data)
    {
        $(iframe).ready(function ()
        {
            // Put the data into the iframe. Thankfully, <pre> is available for displaying fixed-width text data.
            $("<pre>", {
                id:  "textData",
                style: "border: none",
            }).appendTo($(iframe).contents().find("body"));

            $(iframe).contents().find("#textData").text(data);

            $(iframe).get(0).contentWindow.print();
        });
    }, 'text');
}

/**
 *  Decides whether the API URL refers to a PDF or not.
 *  @param  url A URL provided as a string.
 *  @return     boolean
 */
function isPdf(url)
{
    var extension = url.substring(url.lastIndexOf('.') + 1, url.lastIndexOf('?') );
    return (extension === "pdf");
}

/* Begin document observation */
observer.observe(document,	{
                                childList: true,
                                subtree: true
							}
);
