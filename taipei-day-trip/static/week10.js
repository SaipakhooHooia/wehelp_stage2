let mrtData;
fetch("/api/mrts")
  .then(response => response.json())
  .then(data => {
    mrtData = data;
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
          image_url = [];
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

const scrollDistance = window.innerWidth > 1000 ? 800 : 200; // 如果螢幕寬度大於600px，滾動800px，否則滾動500px

document.querySelector('.left-arrow').addEventListener('mousedown', () => {
  document.querySelector('.slides').scrollBy({ left: -scrollDistance, behavior: 'smooth' });
  document.querySelector('.left-arrow').style.backgroundImage = "url('/static/left container_click.png')";
});

document.querySelector('.left-arrow').addEventListener('mouseup', () => {
  document.querySelector('.left-arrow').style.backgroundImage = "url('/static/left container_default.png')";
});

document.querySelector('.right-arrow').addEventListener('mousedown', () => {
  document.querySelector('.slides').scrollBy({ left: scrollDistance, behavior: 'smooth' });
  document.querySelector('.right-arrow').style.backgroundImage = "url('/static/right container_click.png')";
});

document.querySelector('.right-arrow').addEventListener('mouseup', () => {
  document.querySelector('.right-arrow').style.backgroundImage = "url('/static/right container_default.png')";
});

// 用左右鍵盤也可以滑動
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    document.querySelector('.left-arrow').click();
  } else if (e.key === 'ArrowRight') {
    document.querySelector('.right-arrow').click();
  }
});

//-------------------------------下面處理圖片跟景點名稱------------------------------------------
let pageNumber = 0;
let loading = false; // 用來防止重複加載
let keyword = document.getElementsByClassName("searchbar")[0].value;
let image_url = [];
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

loadFirstPage();

function search() {
  pageNumber = 0;
  keyword = document.getElementsByClassName("searchbar")[0].value;
  document.querySelector(".pic_list").innerHTML = "";
  image_url = [];
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
        loading = false; // 無論加載成功或失敗，都將加載標誌設置回 false
      });
  }
}

// 監聽滾動事件
window.addEventListener('scroll', checkScrollBottom);

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
      image_url.push(firstMatch);
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
    if (!item.mrt){
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
  }

  for (let i = 0; i < image_url.length; i++) {
    let container = document.querySelectorAll(".pic_list .picture")[i];
    container.style.backgroundImage = 'url(' + image_url[i] + ')' || '';
  }
  for (let i = 0; i < turist_spot.length; i++) {
    let element = document.querySelectorAll('.pic_list .title')[i];
    element.textContent = turist_spot[i] || '';
  }
}
//-------------------------------下面處理刷新時頁面沒有置頂的問題------------------------------------------
window.setTimeout(function () {
  window.scrollTo(0, 0);
}, 0);

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'; // 禁用scrollRestoration
}
