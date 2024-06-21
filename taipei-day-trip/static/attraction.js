let page_url = window.location.href;
let turist_id = page_url.split('/').pop(); 
console.log('turist_id:', turist_id);
let url =`/api/attraction/${turist_id}`;

async function get(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.log(error);
        window.location.href = `/`;
    }
}
async function placeImg(item) {
    let bookingContainer = document.querySelector(".booking-container");
    let bookingImageContainer = document.querySelector(".booking-image-container");
    let contentContainer = document.querySelector(".attraction-content-container");
    for (let i = 0; i < item.images.length; i++) {
        let bookingImage = document.createElement("div");
        bookingImage.className = "booking-image";
        bookingImage.style.backgroundImage = "url(" + item.images[i] + ")";
        bookingImageContainer.appendChild(bookingImage);
    }
    bookingContainer.appendChild(contentContainer);
    return bookingImageContainer;
}

async function scrollImg(item, bookingImageContainer) {
    let leftArrow = document.querySelector(".attraction-left-arrow");
    let rightArrow = document.querySelector(".attraction-right-arrow");
    let bookingImages = document.querySelectorAll(".booking-image");
    let bookingImagesLength = bookingImages[0].clientWidth;
    console.log("bookingImagesLength: " + bookingImagesLength);
    let scrollPosition = 0;

    leftArrow.addEventListener("mousedown", () => {
        bookingImageContainer.scrollBy({ left: -bookingImagesLength, behavior: 'smooth' }); 
        scrollPosition -= bookingImagesLength;
        console.log("scrollPosition: " + scrollPosition);
        if (scrollPosition < 0) {
            scrollPosition = item.images.length * bookingImagesLength;
            bookingImageContainer.scrollTo({
                left: item.images.length * bookingImagesLength,
                behavior: 'smooth'
            });
        }
    });

    rightArrow.addEventListener("mousedown", () => {
        bookingImageContainer.scrollBy({ left: bookingImagesLength, behavior: 'smooth' });
        scrollPosition += bookingImagesLength;
        if (scrollPosition >= item.images.length * bookingImagesLength) {
            scrollPosition = 0;
            bookingImageContainer.scrollTo({
                left: 0 * bookingImagesLength,
                behavior: 'smooth'
            });
        }
        console.log("scrollPosition: " + scrollPosition);
    });
}

async function attractionContent(item) {
    let bookingContainer = document.querySelector(".booking-container");
    let contentContainer = document.querySelector(".attraction-content-container");
    let attractionNameContainer = document.querySelector(".attraction-name-container");
    let attractionName = document.createTextNode(item.name);
    attractionNameContainer.appendChild(attractionName);

    let catContainer = document.querySelector(".cat-container");
    let catName = document.createTextNode(item.category + " at " + item.mrt);
    catContainer.appendChild(catName);

    let description = document.querySelector(".description");
    let descriptionText = document.createTextNode(item.description);
    description.appendChild(descriptionText);

    let address = document.querySelector(".address");
    let addressText = document.createTextNode(item.address);
    address.appendChild(addressText);

    let transport = document.querySelector(".transport");
    let transportText = document.createTextNode(item.transport);
    transport.appendChild(transportText);

    bookingContainer.appendChild(contentContainer);
}

async function carouselIndicators(item, bookingImageContainer) {
    let carouselIndicators = document.querySelector(".carousel-indicators");
    let bookingImagesLength = document.querySelectorAll(".booking-image")[0].clientWidth;

    for (let i = 0; i < item.images.length; i++) {
        let indicator = document.createElement("div");
        indicator.className = "carousel-indicator";
        if (i === 0) indicator.classList.add("active");
        indicator.addEventListener("click", () => {
            bookingImageContainer.scrollTo({
                left: i * bookingImagesLength,
                behavior: 'smooth'
            });
            updateIndicators(i);
        });
        carouselIndicators.appendChild(indicator);
    }

    bookingImageContainer.addEventListener('scroll', updateIndicatorsOnScroll);
    //在這邊做和圖片索引對照的indicator狀態的更新
    function updateIndicators(activeIndex) {
        let indicators = document.querySelectorAll(".carousel-indicator");
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle("active", index === activeIndex);
        });
    }
    //在這邊做indicator和圖片索引的比對
    function updateIndicatorsOnScroll() {
        let scrollLeft = bookingImageContainer.scrollLeft;
        let activeIndex = Math.round(scrollLeft / bookingImagesLength);
        updateIndicators(activeIndex);
    }
}

function changePrice() {
    const prices = {
        morning: 2000,
        afternoon: 2500
    };

    const timeRadios = document.querySelectorAll('input[name="time"]');
    const priceDiv = document.querySelector('.price');

    for (let radio of timeRadios) {
        radio.addEventListener('change', function() {
            console.log(this); 
            const selectedPrice = prices[this.value];
            priceDiv.textContent = `新台幣 ${selectedPrice} 元`;
        });
    }

    let taipeiTripButton = document.querySelector(".taipei-trip");
    taipeiTripButton.addEventListener("click", () => {
        window.location.href = `/`;
    });
}

async function initialize() {
    const item = await get(url);
    const bookingImageContainer = await placeImg(item);
    await scrollImg(item, bookingImageContainer);
    await attractionContent(item);
    await carouselIndicators(item, bookingImageContainer);
    changePrice();
}

initialize();

//-------------------------------Login/Signup section----------------------------------------------------
let signupResult = document.querySelector(".signup-result");
let loginResult = document.querySelector(".login-result");
let loginState = false;
let logout = document.querySelector(".logout");

function signup(event){
  event.preventDefault();
  let signupName = document.querySelector(".signup-name").value;
  let signupEmail = document.querySelector(".signup-email").value;
  let signupPwd = document.querySelector(".signup-password").value;
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

//let accessToken = localStorage.getItem('accessToken');
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
    }
  } 
  catch (error) {
    console.error('There was a problem with your fetch operation:', error);
    loginState = false;
  }
}

//---------------------------Popup Dialog------------------------------------------------------
let loginSignupLink = document.querySelector(".login-signup");
let popupDialog = document.querySelector(".popup-dialog");
loginSignupLink.addEventListener("click", function(){
  if (popupDialog.style.display === 'block'){
    popupDialog.style.display = 'none';
    setTimeout(() => {
      popupDialog.classList.add("active"); 
  }, 1000);
  }
  else{
    popupDialog.style.display = 'block';
  }
});

let closeIcon = document.querySelector(".close-icon");
closeIcon.addEventListener("click", function(){
  popupDialog.classList.remove("active");
  setTimeout(() => {
    popupDialog.style.display = 'none';
}, 30);
});

let switchToLogin = document.querySelector(".switch-to-login");
let loginArea = document.querySelector(".login-area");
let signupArea = document.querySelector(".signup-area");
switchToLogin.addEventListener("click", function(){
  signupArea.style.display = "none";
  loginArea.style.display = "block";
})

let switchToSignup = document.querySelector(".switch-to-signup");
switchToSignup.addEventListener("click", function(){
  signupArea.style.display = "block";
  loginArea.style.display = "none";
})

//------------------------重載頁面後獲取用戶訊息-----------------------------------
document.addEventListener("DOMContentLoaded", function() {
  user_data();
});

logout.addEventListener("click", function(){
  localStorage.removeItem('accessToken');
  window.location.reload();
})