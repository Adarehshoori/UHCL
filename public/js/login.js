function loginUser() {

    const userEmail = document.getElementById("userEmail").value;
    const userPassword = document.getElementById("userPassword").value;

    var data = {
        userEmail: userEmail,
        userPassword: userPassword
    };

    var json = JSON.stringify(data);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/login");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(json);

    xhr.onreadystatechange = function() { 
        if (xhr.readyState == 4 && xhr.status == 200) {
            var responseData = xhr.responseText; 
            responseData = JSON.parse(responseData);

            sessionStorage.setItem("username", userEmail);
            console.log(responseData.acccessToken);
            sessionStorage.setItem("jwtoken", responseData.accessToken);

            alert(sessionStorage.getItem("username") + " login successful");
            window.location.replace('/');
        }

        if (xhr.readyState == 4 && xhr.status == 403) {
            var responseData = xhr.responseText; 
            responseData = JSON.parse(responseData);
            alert(responseData.message);
        }
    }
}