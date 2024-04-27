function registerUser() {

    const userEmail = document.getElementById("userEmail").value;
    const userPassword = document.getElementById("userPassword").value;

    var data = {
        userEmail: userEmail,
        userPassword: userPassword
    };

    var json = JSON.stringify(data);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/register");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(json);

    xhr.onreadystatechange = function() { 
        if (xhr.readyState == 4 && xhr.status == 200) {
            var responseData = xhr.responseText; 
            responseData = JSON.parse(responseData);
            alert(responseData.message);
            window.location.replace('/login');
        }

        if (xhr.readyState == 4 && xhr.status == 409) {
            var responseData = xhr.responseText; 
            responseData = JSON.parse(responseData);
            alert(responseData.message);
        }

    }
}