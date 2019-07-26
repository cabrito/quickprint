// ==UserScript==
// @name     			Colleague Quick Skip
// @author				cabrito
// @description 	Removes the requirement of Colleague UI to go through Adobe Reader to print.
// @version  			1
// @include  			<<URL TO YOUR COLLEAGUE SERVER HERE>>
// @require 			https://code.jquery.com/jquery-2.2.4.min.js
// @grant    			none
// ==/UserScript==

/* Handles changes to the document appropriately  */
var observer = new MutationObserver(
function (mutations, mi)
{
    // If the Print Remote button exists, remove it and adjust the Save As dialog to say Quick Print
    if ($("#reportPrint").length > 0)
    {
        $("#reportPrint").remove();
        $("#reportSaveAs").text("Quick Print");
    }

    // Create new functionality for the big Download button
    if ($("#fileDownloadBtn").length > 0)
    {
        console.log("Download button detected!");
        var url = $("#fileDownloadBtn").attr("href");
        var adjustedBtn = $("#fileDownloadBtn").clone()
                                                    .attr("id", "quickPrint")
                                                    .attr("href", null)
                                                    .attr("class", "esg-button-style esg-button esg-button--primary")
                                                    .attr("type", "button");
        if (!isPdf(url))
        {
            $(adjustedBtn).text("Quick Print");
            $("#fileDownloadBtn").replaceWith(adjustedBtn);
            adjustedBtn.on("click", function () { quickPrint(url); });
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

function quickPrint(fileUrl)
{
    // Now, make the iframe and print it
    $("<iframe>", {
        id:  "dataWindow",
        frameborder: 0
    }).appendTo("body");

    var iframe = $("#dataWindow");
    $.get(fileUrl, function(data)
    {
        $(iframe).ready(function ()
        {
            $("<pre>", {
                id:  "textData",
                style: "border: none",
            }).appendTo($(iframe).contents().find("body"));

            $(iframe).contents().find("#textData").text(data);

            $(iframe).get(0).contentWindow.print();
        });
    }, 'text');
}

function isPdf(url)
{
    var extension = url.substring(url.lastIndexOf('.') + 1, url.lastIndexOf('?') );
    return (extension === "pdf");
}

/* Begin observation */
observer.observe(document,	{
                                childList: true,
                                subtree: true
							}
);
