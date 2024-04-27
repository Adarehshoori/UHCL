search();

async function search (e) {

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const query = urlParams.get('q');

    if (query != undefined) {
        document.getElementById("searchbox").value = query;

        const config = { params: { q: query } };
        const response = await axios.get('http://api.tvmaze.com/search/shows', config);

        var result = document.getElementById("results");
        result.innerHTML = "";

        if (response.data.length == 0) {
            result.append("No results found :(");
        } else {
            prettify(response.data, query);
        }
    }
}   