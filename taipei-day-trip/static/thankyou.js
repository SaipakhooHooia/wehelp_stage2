function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);//搜尋從問號開始的部分
    return urlParams.get(param);
}

const orderId = getQueryParam('number');
let orderIdContainer = document.querySelector('.order-id');

let accessToken = localStorage.getItem('accessToken');
fetch(`/api/orders/${orderId}`,{
    method:"GET",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
})
.then(responce => responce.json())
.then(data => {
    orderIdContainer.textContent = orderId;
})

//-------------------------------Login/Signup section----------------------------------------------------
let signupResult = document.querySelector(".signup-result");
let loginResult = document.querySelector(".login-result");
let loginState = false;
let logout = document.querySelector(".logout");
let signupName;
let signupEmail;
let signupPwd;

function isEmail(signupEmail){
  let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(signupEmail);
}

function signup(event){
  event.preventDefault();

  signupName = document.querySelector(".signup-name").value;
  signupEmail = document.querySelector(".signup-email").value;
  signupPwd = document.querySelector(".signup-password").value;

  if(!isEmail(signupEmail)){
    signupResult.style.display = "block";
    signupResult.textContent = 'Email invalid.';
    return
  }

  fetch('/api/user', {
      method: 'POST', 
      headers: {
          'Content-Type': 'application/json', 
      },
      body: JSON.stringify({ "name": signupName, "email": signupEmail, "password": signupPwd })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
  })
  .then(data => {
      if (data.ok) {
          console.log('Signup success.');
          signupResult.style.display = "block";
          signupResult.textContent = 'Signup success.';
      } 
      else if (data.error) {
          console.log('Signup failed.');
          signupResult.style.display = "block";
          signupResult.textContent = data.message;
      }
  })
  .catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
  });
}

function login(event){
  event.preventDefault();
  let loginEmail = document.querySelector(".login-email").value;
  let loginPwd = document.querySelector(".login-password").value;
  fetch('/api/user/auth', {
      method: 'PUT', 
      headers: {
          'Content-Type': 'application/json', 
      },
      body: JSON.stringify({ "email": loginEmail, "password": loginPwd })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
  })
  .then(data => {
      if (data.token) {
          localStorage.setItem('accessToken', data.token);
          console.log('Login success.');
          loginResult.style.display = "block";
          loginResult.textContent = 'Login success.';
          user_data();
          window.location.reload();
          loginState = true;
          if (loginState) {
            logout.style.display = "block";
            loginSignupLink.style.display = "none";
          }
      } 
      else if (data.error) {
          console.log('Login failed.');
          loginResult.style.display = "block";
          loginResult.textContent = data.message;
          loginState = false;
      }
  })
  .catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
  });
}

let greeting = document.querySelector(".greeting");
let contactName = document.querySelector(".contact-name");
let contactEmail = document.querySelector(".contact-email");
let userData = null;

async function user_data() {
  let accessToken = localStorage.getItem('accessToken');
  try {
    let response = await fetch('/api/user/auth', {
      method: 'GET', 
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json', 
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    let data = await response.json();
    loginState = true;
    console.log(data);
    if (loginState) {
      logout.style.display = "block";
      loginSignupLink.style.display = "none";
      userName = data.name;
      greeting.textContent = `您好， ${data.name}，待預定的行程如下:`;
      contactName.value = data.name;
      contactEmail.value = data.email;
      userData = data;
    }
  } 
  catch (error) {
    console.error('There was a problem with your fetch operation:', error);
    loginState = false;
  }
}

//import { user_data } from "./user_data_module.js";

//---------------------------Popup Dialog------------------------------------------------------
let loginSignupLink = document.querySelector(".login-signup");
let popupDialog = document.querySelector(".popup-dialog");

function loginSignup(){
    if (popupDialog.style.display === 'block'){
        popupDialog.style.display = 'none';
        setTimeout(() => {
        popupDialog.classList.add("active"); 
    }, 1000);
    }
    else{
        popupDialog.style.display = 'block';
}}
  
function closeDialog(){
    popupDialog.classList.remove("active");
    setTimeout(() => {
        popupDialog.style.display = 'none';
    }, 30);
}

let switchToLogin = document.querySelector(".switch-to-login");
let loginArea = document.querySelector(".login-area");
let signupArea = document.querySelector(".signup-area");

function toLogin(){
    signupArea.style.display = "none";
    loginArea.style.display = "block";
}

function toSignup(){
    signupArea.style.display = "block";
    loginArea.style.display = "none";
}

function toLogout(){
    localStorage.removeItem('accessToken');
    window.location.href = "/";
}
//-------------------------------Footer section----------------------------------------------------
let body = document.querySelector("body");
/*function setFooterHeight() {
    let footer = document.querySelector(".footer");
    const viewportHeight = window.innerHeight;
    footer.style.height = viewportHeight - 206.3 + "px";
}
setFooterHeight();*/
//----------------------booking system------------------------------
let bookingData = null;
function booking(){
    let image = document.querySelector(".image");
    let line1 = document.querySelector(".name");
    let line2 = document.querySelector(".date");
    let line3 = document.querySelector(".time");
    let line4 = document.querySelector(".price");
    let line5 = document.querySelector(".address");
    let totalPrice = document.querySelector(".total-price");
    let remind = document.querySelector(".remind");
    let body = document.querySelector("body"); 
    fetch('/api/booking', {
        method: "GET",
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json', 
          }
    })
    .then(response => response.json())
    .then(data => {
        bookingData = data.data;
        console.log("Response text:", data);
        image.style.backgroundImage = `url(${data.data.attraction.image})`;
        line1.textContent = data.data.attraction.name;
        line2.textContent = data.data.date;
        if (data.data.time === "morning"){
            line3.textContent = `早上九點到下午四點`;
        }
        else if (data.data.time === "afternoon"){
            line3.textContent = `下午兩點到晚上九點`;
        }
        line4.textContent = data.data.price;
        line5.textContent = data.data.attraction.address;
        totalPrice.textContent = `新台幣 ${data.data.price} 元`;
        
    })
    .catch(error => {
        noSchedule();
        remind.textContent = "目前沒有任何待預訂的行程";
        body.style.maxHeight = "100vh";
        setFooterHeight();
    })
}


document.addEventListener("DOMContentLoaded", function() {
    if (accessToken){
        booking();
    }
    else{
        window.location.href = "/";
    }
});

function setFooterHeight() {
    let footer = document.querySelector(".footer");
    const viewportHeight = window.innerHeight;
    footer.style.height = viewportHeight - 206.3 + "px";
}
function getDate(){
    let today = new Date();
    let year = today.getFullYear();
    let month = String(today.getMonth() + 1).padStart(2, '0');
    let day = String(today.getDate()).padStart(2, '0');
    let formattedDate = `${year}-${month}-${day}`;
    return formattedDate
}

let submitButton = document.querySelector(".submit-button");

function schedule(){
    if (accessToken){
        window.location.href = "/booking";
        booking(); 
    }
    else if(accessToken ===false){
        loginSignup();
    }
}

function noSchedule(){
    let bookingContainer = document.querySelector(".booking-container");
    bookingContainer.style.display = "none";
}

async function initialize() {
    user_data();
}

initialize();

async function user_data() {
  let accessToken = localStorage.getItem('accessToken');
  try {
    let response = await fetch('/api/user/auth', {
      method: 'GET', 
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json', 
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    let data = await response.json();
    loginState = true;
    console.log(data);
    if (loginState) {
      logout.style.display = "block";
      loginSignupLink.style.display = "none";
      userName = data.name;
      greeting.textContent = `您好， ${data.name}，待預定的行程如下:`;
      contactName.value = data.name;
      contactEmail.value = data.email;
      userData = data;
    }
  } 
  catch (error) {
    console.error('There was a problem with your fetch operation:', error);
    loginState = false;
  }
}