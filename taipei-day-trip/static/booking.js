let page_url = window.location.href;
let turist_id = page_url.split('/').pop(); 
console.log('turist_id:', turist_id);
let url =`/api/attraction/${turist_id}`;

let selectedTime;
let selectedPrice;
function changePrice() {
    const prices = {
        morning: 2000,
        afternoon: 2500
    };

    let timeRadios = document.querySelectorAll('input[name="time"]');
    let priceDiv = document.querySelector('.price');

    for (let radio of timeRadios) {
        radio.addEventListener('change', function() {
            console.log(this); 
            selectedTime = this.value;
            selectedPrice = prices[this.value];
            priceDiv.textContent = `新台幣 ${selectedPrice} 元`;
        });
    }  
    //return {"time": selectedTime, "price": selectedPrice};
}

let taipeiTripButton = document.querySelector(".taipei-trip");
    taipeiTripButton.addEventListener("click", () => {
    window.location.href = `/`;
});

async function initialize() {
    changePrice();
    user_data();
}

initialize();

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

let accessToken = localStorage.getItem('accessToken');
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
    if (loginState){
        window.location.href = "/booking";
        booking(); 
    }
    else if(loginState ===false){
        loginSignup();
    }
}

//-------------------------------Delete section----------------------------------------------------
let deleteIcon = document.querySelector(".icon-delete");

function deleteBooking(){
    fetch('/api/booking', {
        method: "DELETE",
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json', 
          }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        window.location.reload();
    })
    .catch(error => console.log(error))
}

function noSchedule(){
    let bookingContainer = document.querySelector(".booking-container");
    bookingContainer.style.display = "none";
}

//-------------------------------GetPrime section----------------------------------------------------
let APP_ID = 151667;
let APP_KEY = "app_w9o9z86GgK37YgOsND8SbZ9qiiScnUNOAYPCx6Gi4LaBZQzOAJQ8NtMYvxRr";
TPDirect.setupSDK(APP_ID, APP_KEY, "sandbox");

TPDirect.card.setup({
    fields: {
    number: {
        element: '.form-control.card-number',
        placeholder: '**** **** **** ****'
    },
    expirationDate: {
        element: document.getElementById('tappay-expiration-date'),
        placeholder: 'MM / YY'
    },
    ccv: {
        element: '.form-control.ccv',
        placeholder: 'CCV'
    }
    },
    styles: {
    'input': {
          'color': 'gray'
    },
    'input.ccv': {
        // 'font-size': '16px'
    },
    ':focus': {
        'color': 'black'
    },
    '.valid': {
        'color': 'green'
    },
    '.invalid': {
        'color': 'red'
    },
    '@media screen and (max-width: 400px)': {
        'input': {
        'color': 'orange'
        }
    }
    },
    isMaskCreditCardNumber: true,
    maskCreditCardNumberRange: {
        beginIndex: 6, 
        endIndex: 11
    }
});
/*
TPDirect.card.onUpdate(function (update) {
    if (update.canGetPrime) {
    $('button[type="submit"]').removeAttr('disabled');
    } else {
    $('button[type="submit"]').attr('disabled', true);
    }

    var newType = update.cardType === 'unknown' ? '' : update.cardType;
    $('#cardtype').text(newType);

    if (update.status.number === 2) {
        setNumberFormGroupToError('.card-number-group');
      } else if (update.status.number === 0) {
        setNumberFormGroupToSuccess('.card-number-group');
      } else {
        setNumberFormGroupToNormal('.card-number-group');
      }

      if (update.status.expiry === 2) {
        setNumberFormGroupToError('.expiration-date-group');
      } else if (update.status.expiry === 0) {
        setNumberFormGroupToSuccess('.expiration-date-group');
      } else {
        setNumberFormGroupToNormal('.expiration-date-group');
      }

      if (update.status.ccv === 2) {
        setNumberFormGroupToError('.ccv-group');
      } else if (update.status.ccv === 0) {
        setNumberFormGroupToSuccess('.ccv-group');
      } else {
        setNumberFormGroupToNormal('.ccv-group');
      }
    });*/

let orderId = null;
function comfirmPay() {
    let phoneNumber = document.querySelector(".contact-number").value;
    //console.log('Phone number:', phoneNumber);
      TPDirect.card.getPrime(function (result) {
        if (result.status !== 0) {
          alert('卡片資訊錯誤');
          return false;
        }
        let prime = result.card.prime;
        //alert('getPrime 成功: ' + prime);
        fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            "prime": prime, 
            "order":{
                "price": bookingData.price, 
                "trip": {
                    "attraction":{
                        "id": bookingData.attraction.id, 
                        "name": bookingData.attraction.name, 
                        "address": bookingData.attraction.address, 
                        "image": bookingData.attraction.image},
                    "date": bookingData.date, 
                    "time": bookingData.time},
                "contact":{
                    "name": userData.name, 
                    "email": userData.email, 
                    "phone": phoneNumber}
        }})
        })
        .then(response => response.json())
        .then(data => {
            if (data.data.payment.status === 0) {
                orderId = data.data.number;
                window.location.href = `/thankyou?number=${orderId}`;
            }
            else{
                alert(`Payment failed: ${data.data.payment.message}`);
            }
        })
      });
}