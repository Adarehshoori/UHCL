// Checks for night mode and changes page. I will make this its own function later for all forms to call from.
if (localStorage.getItem("nightmode")) {
    var isnightmode = localStorage.getItem("nightmode");
    if (isnightmode == "true") {
        document.body.style.backgroundColor = "grey"
        if (document.getElementById("nightbtn")) {
            document.getElementById("nightbtn").innerHTML = "\uD83C\uDF11";
        }
    } else {
        document.body.style.backgroundColor = "ghostwhite"
        if (document.getElementById("nightbtn")) {
            document.getElementById("nightbtn").innerHTML = "\u2600\uFE0F";
        }
    }
} else {
    var isnightmode = "false";
    localStorage.setItem("nightmode", isnightmode);
}

search();
async function search (e) {
    if (sessionStorage.getItem("jwtoken")) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/myshows");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader('Authorization', 'Bearer ' + sessionStorage.getItem("jwtoken"));
        xhr.send();

        xhr.onreadystatechange = function() {
            var result = document.getElementById("numofresults");
            if (xhr.readyState == 4 && xhr.status == 200) {
                var responseData = xhr.responseText; 
                if (responseData.length == 2) {
                    result.append("No TV-Shows found. Search and save some!");
                    document.getElementById("delete_all").style.visibility = "hidden";
                } else {
                    result.innerHTML = "";
                    responseData = JSON.parse(responseData);
                    prettify(responseData);
                }
            } else if (xhr.readyState != 4 && xhr.status != 200) {
                var responseData = xhr.responseText;
                responseData = JSON.parse(responseData);
                result.append("Error retrieving saved shows.");
            }
        }
        
    } else {
        document.getElementById("numofresults").innerHTML = "Please sign in to view your shows here.";
        document.getElementById("delete_all").style.visibility = "hidden";
    }
}   


function prettify(response) {
    var i = 0;
    for (let result of response) {
        let sqlid = JSON.parse(result.id)
        result = JSON.parse(result.information);

        // Only display the show if it has a cover. Otherwise it's probably not popular enough anyways to show.
        if (result.image != null && result.image.medium != null) {
            i = i + 1;

            // This unordered list is where all the show's main info will go.
            const showinfo = document.createElement("UL");
            showinfo.setAttribute("id", "listitems")

            // This creates an image and adds it to the appropriate CSS class.
            const img = document.createElement('img');
            img.src = result.image.medium;

            // This allows the user to click the image and it takes them to the official site of the show.
            img.onclick = function() {
                if (result.officialSite) {
                    window.open(result.officialSite, '_blank');
                }
            }

            img.className += "IMGBox";

            // Creates the main show's title and adds it to the "TitleText" class.
            const showname = document.createElement("H3");
            showname.innerHTML = result.name;
            showname.className += "TitleText";

            // Creates list item element and populates it with the premiere date if available.
            const premiered = document.createElement("LI");
            if (result.premiered != null) {
                // This is to write it in the proper M/D/Y format instead of its default date.
                var releasedate = (result.premiered);
                releasedate = releasedate.split("-");
                var releaseyear = releasedate[0];
                var releasemonth = releasedate[1];
                var releaseday = releasedate[2];
                premiered.appendChild(document.createTextNode("Premiered: " + releasemonth + "-" + releaseday + "-" + releaseyear));
            } else {
                premiered.appendChild(document.createTextNode("Premiered: " + "N/A"));
            }
            // This checks if the show was released in the current year and creates a badge for it. Kept separate from above for cleanliness.
            const newbadge = document.createElement('span');
            if (result.premiered != null) {
                var releasedate = (result.premiered);
                releasedate = releasedate.split("-");
                var releaseyear = releasedate[0];
                currentyear = new Date().getFullYear();
                if (releaseyear == currentyear) {
                    newbadge.appendChild(document.createTextNode("new" +  "\u26A1"));
                    newbadge.className += "newbadge";
                }
            }

            // Creates list item element and populates it with the runtime of show if available.
            const runtime = document.createElement("LI");
            if (result.runtime != null) {
                runtime.appendChild(document.createTextNode("Runtime: " + result.runtime + " minutes"));
            } else if (result.averageRuntime != null) {
                runtime.appendChild(document.createTextNode("Runtime: " + result.averageRuntime + " minutes"));
            } else {
                runtime.appendChild(document.createTextNode("Runtime: " + " N/A"));
            }

            // Creates list item element and populates it with the current status of the show if available.
            const showrunning = document.createElement("LI");
            if (result.status != null) {
                if (result.status === "Ended") {
                    showrunning.appendChild(document.createTextNode("Status: " + result.status + " :("));
                } else {
                    showrunning.appendChild(document.createTextNode("Status: " + result.status));
                }
            } else {
                showrunning.appendChild(document.createTextNode("Status: " + "N/A"));
            }

            // Creates list item element and populates it with the network and country of network with flag image if available.
            const network = document.createElement("LI");  
            if (result.network != null) {
                // This part looks into the flags.js file and runs the function used to determine the flag image for that country if available.
                countryname = result.network.country.name;
                var flag_img_src = choosecountryflag(countryname);
                const flagimg = document.createElement('img');
                flagimg.src = flag_img_src;
                // This part just appends the text of the network of the show.
                network.appendChild(document.createTextNode("Network: " + result.network.name));
                network.appendChild(flagimg);
                flagimg.className += "FlagBox";
            } else if (result.webChannel.name != null) {
                // This part looks into the flags.js file and runs the function used to determine the web channel logo if available.
                webchannelname = result.webChannel.name;
                var channel_logo_src = channellogo(webchannelname);
                // This is to just not put any logo if it doesn't find one.
                if (channel_logo_src == "") {
                    network.appendChild(document.createTextNode("Network: " + result.webChannel.name));
                } else {
                    const webchannelimg = document.createElement('img');
                webchannelimg.src = channel_logo_src;
                // This part just appends the text of the web channel of the show.
                network.appendChild(document.createTextNode("Network: "));
                network.appendChild(webchannelimg);
                webchannelimg.className += "WebChannelBox";
                }
            } else {
                network.appendChild(document.createTextNode("Network: " + "N/A"));
            }

            // Calculates number of genres to see if array is empty then creates and populates the list element with data if available.
            const genreslistcheck = result.genres.length;
            const genres = document.createElement("LI");
            if (genreslistcheck != 0) {
                const genreslist = (result.genres).join(", ");
                genres.appendChild(document.createTextNode("Genres: " + genreslist));
            } else {
                genres.appendChild(document.createTextNode("Genres: N/A"));
            }

            // This checks for and creates the entry for the language of the show.
            const language = document.createElement("LI");
            if (result.language != null) {
                language.appendChild(document.createTextNode("Language: " + result.language));
            } else {
                language.appendChild(document.createTextNode("Language: N/A"));
            }

            // This checks for and creates the entry for the schedule of the show.
            const schedule = document.createElement("LI");
            var showtime = result.schedule.time;
            showtime = showtime.split(":");
            showhour = (showtime[0]);
            showminute = (showtime[1]);
            // Converts 24-hour time to AM/PM 12-hour time
            if (showhour < 12 && showhour >= 10) {
                showtime = (showhour + ":" + showminute + " AM");
            } else if (showhour < 10 && showhour > 0) {
                showhour = showhour.replaceAll("0", "");
                showtime = (showhour + ":" + showminute + " AM");
            } else if (showhour == 0) {
                showtime = ("12" + ":" + showminute + " AM");
            } else if (showhour == 12) {
                showtime = ("12" + ":" + showminute + " PM");
            } else {
                showhour = showhour - 12;
                showtime = (showhour + ":" + showminute + " PM");
            }
            var showday = (result.schedule.days).join(", ");
            showday = showday.replaceAll("Monday", "Mon");
            showday = showday.replaceAll("Tuesday", "Tue");
            showday = showday.replaceAll("Wednesday", "Wed");
            showday = showday.replaceAll("Thursday", "Thu");
            showday = showday.replaceAll("Friday", "Fri");
            showday = showday.replaceAll("Saturday", "Sat");
            showday = showday.replaceAll("Sunday", "Sun");
            if (result.schedule.days.length != 0) {
                if (result.schedule.time != "") {
                    schedule.appendChild(document.createTextNode("Schedule: " + showday + " @" + showtime));
                } else {
                    schedule.appendChild(document.createTextNode("Schedule: " + showday));
                }
            } else {
                schedule.appendChild(document.createTextNode("Schedule: N/A"))
            }

            // Creates a new paragraph element containing the summary of the show.
            const summary = document.createElement("p");
            const summarytext = result.summary;
            // This replaces any HTMl elements from the string and returns a clean summary.
            if (summarytext != null) {
                var fixedsummarytext = summarytext.replaceAll("<p>", "");
                fixedsummarytext = fixedsummarytext.replaceAll("</p>", "");
                fixedsummarytext = fixedsummarytext.replaceAll("<b>", "");
                fixedsummarytext = fixedsummarytext.replaceAll("</b>", "");
                fixedsummarytext = fixedsummarytext.replaceAll("<i>", "");
                fixedsummarytext = fixedsummarytext.replaceAll("</i>", "");
                fixedsummarytext = fixedsummarytext.replaceAll('""', '');
                fixedsummarytext = fixedsummarytext.replaceAll('*', '');
                fixedsummarytext = fixedsummarytext.replaceAll('<br />', '');
                // Creates hover summary text for each show.
                summary.title = fixedsummarytext;
                // This cuts off the last word of the first 110 characters of the summary if long enough. Probably changing this value soon.
                if (fixedsummarytext.length > 110) {
                    fixedsummarytext = fixedsummarytext.substring(0, 110);
                    var lastword = fixedsummarytext.lastIndexOf(" ");
                    fixedsummarytext = fixedsummarytext.substring(0, lastword);
                    fixedsummarytext = fixedsummarytext + "...";
                }
                summary.appendChild(document.createTextNode('"' + fixedsummarytext + '"'));
            } else {
                summary.appendChild(document.createTextNode("Summary N/A"));
            }
            summary.className += "SummaryText";

            // This is the part for creating all the badges if the show meets some criteria.
            const popbadge = document.createElement('span');
            const classicbadge = document.createElement('span');
            const topratedbadge = document.createElement('span');
            const mustwatchbadge = document.createElement('span');
            const funnybadge = document.createElement('span');
            const scarybadge = document.createElement('span');
            // This creates the badge and appends if it's popular/classic/top-rated enough.
            if (result.weight >= 86) {
                popbadge.appendChild(document.createTextNode("popular " +  "\uD83D\uDD25"));
                popbadge.className += "popularbadge";
                if (result.rating.average >= 7.8 && result.rating.average < 8.6) {
                    // This only happens if the show is popular and quite highly rated
                    topratedbadge.appendChild(document.createTextNode("top-rated " +  "\uD83D\uDC4C"));
                    topratedbadge.className += "topratedbadge";
                } else if (result.rating.average >= 8.6) {
                    // This only happens if the show is popular and very highly rated
                    mustwatchbadge.appendChild(document.createTextNode("must-watch " +  "\uD83D\uDC8E"));
                    mustwatchbadge.className += "mustwatchbadge";
                }

                // This only happens if the show is popular and also an older show; not necssarily top-rated but a show people still watch.
                if (releaseyear <= 2000) {
                    classicbadge.appendChild(document.createTextNode("classic " +  "\uD83D\uDCFA"));
                    classicbadge.className += "classicbadge";
                }
            } else if (result.rating.average >= 8) {
                topratedbadge.appendChild(document.createTextNode("top-rated " +  "\uD83D\uDC4C"));
                topratedbadge.className += "topratedbadge";
                    if (releaseyear <= 2000) {
                        classicbadge.appendChild(document.createTextNode("classic " +  "\uD83D\uDCFA"));
                        classicbadge.className += "classicbadge";
                    }
            }

            // This is for the funny and scary badges
            var funny = false;
            var scary = false;
            var local_genres = result.genres;
            for (var j = 0; j < local_genres.length; j++) {
                if (local_genres[j] == "Comedy") {
                    funny = true;
                } else if (local_genres[j] == "Horror" || (local_genres[j] == "Supernatural")) {
                    scary = true;
                }
            }
            // Checks if the show is highly rated and also in the "comedy" genre. Adds appropriate badge.
            if (result.rating.average >= 7.6 && funny) {
                funnybadge.appendChild(document.createTextNode("funny " +  "\uD83D\uDE02"));
                funnybadge.className += "funnybadge";
            }
            // Checks if the show is highly rated and also in the "horror" genre. Adds appropriate badge.
            if (result.rating.average >= 7.6 && scary) {
                scarybadge.appendChild(document.createTextNode("eerie " +  "\uD83D\uDC7B"));
                scarybadge.className += "scarybadge";
            }

            // This part is for the kid friendly badge depending if it's in the "children" genre.
            const kidfriendlybadge = document.createElement('span');
            if (result.genres.includes("Children")) {
                kidfriendlybadge.appendChild(document.createTextNode("kid-friendly " + "\uD83E\uDDD2"));
                kidfriendlybadge.className += "kidfriendlybadge";
            }

            // This creates a new "P" element and adds the rating for the show if available. Also adds element to the "ratingtext" CSS element.
            const rating = document.createElement("P");
            const stars = document.createElement("P");
            if (result.rating.average) {
                // Adds decimal .0 point if number is an integer.
                if (result.rating.average % 1 != 0) {
                    rating.innerText = result.rating.average;
                } else {
                    rating.innerText = result.rating.average + ".0";
                }
                // Calculates the number of stars and prints on a loop
                no_stars = result.rating.average / 2;
                no_stars = Math.round(no_stars);
                for (var k = 0; k < no_stars; k++) {
                    stars.innerText = stars.innerText + "\u2B50"
                }
                stars.className += "starstext";
                rating.className += "ratingtext";
            } else {
                rating.innerText = "N/A";
                stars.innerText = "\u2B50"
                stars.className += "starstext";
                rating.className += "ratingtext";
            }


            //console.log(result)
            let delButton = document.createElement('button');
            delButton.appendChild(document.createTextNode("Remove Show"));

            //console.log(sqlid);
            delButton.onclick = (function() {
                //console.log(sqlid)
                delShow(String(sqlid));
            });
            delButton.className += "delbtn";


            // Order the show information
            showinfo.appendChild(genres);
            showinfo.appendChild(premiered);
            showinfo.appendChild(runtime);
            showinfo.appendChild(showrunning);
            showinfo.appendChild(schedule);
            showinfo.appendChild(language);
            showinfo.appendChild(network);

            // Appends everything together
            var textandimage = document.createElement("div");
            textandimage.append(showname);
            textandimage.append(img);
            textandimage.append(rating);
            textandimage.append(stars);
            textandimage.append(popbadge);
            textandimage.append(newbadge);
            textandimage.append(classicbadge);
            textandimage.append(topratedbadge);
            textandimage.append(mustwatchbadge);
            textandimage.append(kidfriendlybadge);
            textandimage.append(scarybadge);
            textandimage.append(funnybadge);
            textandimage.append(summary);
            textandimage.append(showinfo);
            textandimage.append(delButton);
            textandimage.className += "BorderClass";

            // Gets the "results" "div" we manually created in HTML and appends everything we appended above to this single "div".
            var bodyelement = document.getElementById("results");
            bodyelement.append(textandimage);

        }
 
    }
        // This just counts the number of results and prints it on the front-end.
        const numofresultsText = document.createElement('p');
        if (i == 0) {
            numofresultsText.appendChild(document.createTextNode("No TV-Shows found. Search and save some!"));
        } else {
            numofresultsText.appendChild(document.createTextNode(i + " TV-Show(s) found"));
        }
        numofresultsText.className += "numofresults";
        var numberofresults = document.getElementById("numofresults");
        numberofresults.appendChild(numofresultsText);

        let delete_shows = document.getElementById("delete_all");
        delete_shows.appendChild(document.createTextNode("Remove all saved shows"));
        delete_shows.onclick = function() {
            delete_all_shows();
        }

    i = 0;
}

// Deletes all user's shows.
function delete_all_shows() {
    console.log("delete all shows");

    var xhr = new XMLHttpRequest();
    xhr.open("DELETE", "/delallshows");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader('Authorization', 'Bearer ' + sessionStorage.getItem("jwtoken"));
    xhr.send();

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var responseData = xhr.responseText; 
            responseData = JSON.parse(responseData);
            location.reload();
        } else if (xhr.readyState != 4 && xhr.status != 200) {
            var responseData = xhr.responseText; 
            responseData = JSON.parse(responseData);
            alert(responseData.message)
        }
    }
}


// Deletes the TV Show
function delShow(delID) {

    var data = {
        id: delID
    };

    var json = JSON.stringify(data);

    var xhr = new XMLHttpRequest();
    xhr.open("DELETE", "/delshow");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader('Authorization', 'Bearer ' + sessionStorage.getItem("jwtoken"));
    xhr.send(json);

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var responseData = xhr.responseText; 
            responseData = JSON.parse(responseData);
            location.reload();
        } else if (xhr.readyState != 4 && xhr.status != 200) {
            var responseData = xhr.responseText; 
            responseData = JSON.parse(responseData);
            alert(responseData.message)
        }
    }
}