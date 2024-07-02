function mrtInfo(){
  fetch("/api/mrts")
  .then(response => response.json())
  .then(data => {
    let mrtData = data;
    if (mrtData) {
      let slides = document.querySelector(".slides");
      for (let i = 0; i < mrtData.data.length; i++) {
        let slide = document.createElement('div');
        slide.className = "slide";
        let station = mrtData.data[i];
        slide.textContent = station;
        slide.addEventListener('click', function () {
          pageNumber = 0;
          document.querySelector(".pic_list").innerHTML = "";
          //image_url = [];
          turist_spot = [];
          keyword = station;
          url = buildUrl(pageNumber);
          loadFirstPage()
          document.getElementsByClassName("searchbar")[0].value = station;
        });

        slide.addEventListener("mousedown", function () {
          slide.style.color = "#666666";
        });

        slide.addEventListener("mouseup", function () {
          slide.style.color = "#000000";
        });

        slides.appendChild(slide);
      }
    }
  })
  .catch(error => console.log(`Error: ${error}`));
}

function scroll(){
  const scrollDistance = window.innerWidth > 800 ? 600 : 100; // 如果螢幕寬度大於600px，滾動800px，否則滾動500px

  document.querySelector('.left-arrow').addEventListener('mousedown', () => {
    document.querySelector('.slides').scrollBy({ left: -scrollDistance, behavior: 'smooth' });
  });


  document.querySelector('.right-arrow').addEventListener('mousedown', () => {
    document.querySelector('.slides').scrollBy({ left: scrollDistance, behavior: 'smooth' });
  });

  // 用左右鍵盤也可以滑動
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      document.querySelector('.left-arrow').click();
    } else if (e.key === 'ArrowRight') {
      document.querySelector('.right-arrow').click();
    }
    });
}
//-------------------------------下面處理圖片跟景點名稱------------------------------------------
let pageNumber = 0;
let loading = false; // 用來防止重複加載
let keyword = document.getElementsByClassName("searchbar")[0].value;
//let image_url = [];
let turist_spot = [];
let hasMorePages = true;

function buildUrl(page) {
  let base = `/api/attractions?page=${page}`;
  if (keyword) {
    return base + `&keyword=${encodeURIComponent(keyword)}`; // 使用encodeURIComponent來處理特殊字符
  }
  return base;
}

function loadFirstPage() {
  let url = buildUrl(pageNumber); 
  fetch(url)
    .then(response => response.json())
    .then(data => {
      loadContent(data);
      if (data.nextPage !== null) {
        pageNumber++;
        url = buildUrl(pageNumber);
      } else {
        hasMorePages = false;
      }
    })
    .catch(error => console.log(error));
}

function search() {
  pageNumber = 0;
  keyword = document.getElementsByClassName("searchbar")[0].value;
  document.querySelector(".pic_list").innerHTML = "";
  //image_url = [];
  turist_spot = [];
  hasMorePages = true;
  loadFirstPage(); 
}

function checkScrollBottom() {
  if (window.scrollY < 100) return;
  let sentinelRect = document.querySelector('.sentinel').getBoundingClientRect();
  let sentinelVisible = sentinelRect.bottom > 0 && sentinelRect.bottom <= window.innerHeight;
  if (sentinelVisible && !loading && hasMorePages) {
    loading = true; // 設置加載標誌為 true
    let url = buildUrl(pageNumber);
    fetch(url)
      .then(response => response.json())
      .then(data => {
        loadContent(data);
        if (data.nextPage !== null) {
          pageNumber++;
        } else {
          hasMorePages = false;
        }
      })
      .catch(error => console.error('Error:', error))
      .finally(() => {
        loading = false; 
      });
  }
}

function loadContent(data) {
  for (let i = 0; i < data.data.length; i++) {
    let item = data.data[i];
    let picture = document.createElement("div");
    picture.className = "picture";
    let title = document.createElement("div");
    title.className = "title";

    let regex = /https:\/\/.*?\.jpg/gi;
    let match = regex.exec(item.images);
    if (match) {
      let firstMatch = match[0];
      //image_url.push(firstMatch);
      let img = new Image();
      img.src = firstMatch;
      picture.style.backgroundImage = 'url(' + firstMatch + ')';
    }

    turist_spot.push(item.name);
    let spanElement = document.createElement('span');
    spanElement.style.alignItems = "center";
    spanElement.style.justifyContent = "center";
    spanElement.style.display = "flex";
    let textNode = document.createTextNode(item.name);
    spanElement.appendChild(textNode);
    title.appendChild(spanElement);

    let whiteBox = document.createElement("div");
    whiteBox.className = "white-box"
    let mrtBox = document.createElement("div");
    mrtBox.className = "mrtBox";
    let mrtStation;

    if(!item.mrt){
      mrtStation = document.createTextNode("");
    }
    else{
      mrtStation = document.createTextNode(item.mrt);
    }
    mrtBox.appendChild(mrtStation);
    let catBox = document.createElement("div");
    catBox.className = "catBox";
    let category = document.createTextNode(item.category);
    catBox.appendChild(category);
    whiteBox.appendChild(mrtBox);
    whiteBox.appendChild(catBox);

    let pictureContainer = document.createElement("div");
    pictureContainer.className = "picture-container";
    picture.appendChild(title);
    pictureContainer.appendChild(picture);
    let bigContainer = document.createElement("div");
    bigContainer.className = "big-container";
    bigContainer.appendChild(pictureContainer);
    bigContainer.appendChild(whiteBox);
    document.querySelector(".pic_list").appendChild(bigContainer);

    pictureContainer.addEventListener("click",() =>{
      const attractionId = item.id;
      window.location.href = `/attraction/${attractionId}`;
    });
  }

  /*for (let i = 0; i < image_url.length; i++) {
    let container = document.querySelectorAll(".pic_list .picture")[i];
    container.style.backgroundImage = 'url(' + image_url[i] + ')' || '';
  }*/
  for (let i = 0; i < turist_spot.length; i++) {
    let element = document.querySelectorAll('.pic_list .title')[i];
    element.textContent = turist_spot[i] || '';
  }
}

let taipeiTripButton = document.querySelector(".taipei-trip");
taipeiTripButton.addEventListener("click",() => {
    window.location.href = `/`;
})

//-------------------------------下面處理刷新時頁面沒有置頂的問題------------------------------------------
window.setTimeout(function () {
  window.scrollTo(0, 0);
}, 0);

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'; // 禁用scrollRestoration
}
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
    window.location.reload();
}

function initialize(){
  mrtInfo();
  scroll();
  loadFirstPage();
  window.addEventListener('scroll', checkScrollBottom);
  user_data();
}

initialize();

//------------------------Check login state-----------------------

//----------------------booking system------------------------------
function getDate(){
  let today = new Date();
  let year = today.getFullYear();
  let month = String(today.getMonth() + 1).padStart(2, '0');
  let day = String(today.getDate()).padStart(2, '0');
  let formattedDate = `${year}-${month}-${day}`;
  return formattedDate
}

let submitButton = document.querySelector(".submit-button");
function bookingButton() {
  let today = getDate();
  
  fetch("/api/booking", {
      method: "POST",
      headers: {
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ "attractionId": turist_id, "date": today, "time": selectedTime, "price": selectedPrice })
  })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => {
      console.error('Error:', error);
      popupDialog.style.display = 'block';});
}

function schedule(){
  if (loginState){
      window.location.href = "/booking";
  }
  else if(loginState ===false){
      loginSignup();
  }
}