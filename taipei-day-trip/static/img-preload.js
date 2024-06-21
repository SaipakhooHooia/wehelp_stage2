let page_url = window.location.href;
let turist_id = page_url.split('/').pop(); 
console.log('turist_id:', turist_id);
let url =`/api/attraction/${turist_id}`;
let isScrolling = false;

fetch(url)
.then(response => response.json())
.then(data => {
    console.log(data);
    item = data.data;
    let bookingContainer = document.querySelector(".booking-container");
    
    let bookingImageContainer = document.querySelector(".booking-image-container");

    let imagesLoaded = 0;
    let totalImages = item.images.length;

    for (let i = 0; i < item.images.length; i++) {
        let img = new Image();
        img.src = item.images[i];
        img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                // All images are loaded, now append them to the container
                for (let j = 0; j < item.images.length; j++) {
                    let bookingImage = document.createElement("div");
                    bookingImage.className = "booking-image";
                    bookingImage.style.backgroundImage = "url(" + item.images[j] + ")";
                    bookingImageContainer.appendChild(bookingImage);
                }
                setupArrowsAndIndicators();
            }
        };
    }
    
    for (let i = 0; i<item.images.length; i++){
        let bookingImage = document.createElement("div");
        bookingImage.className = "booking-image";
        bookingImage.style.backgroundImage = "url("+item.images[i]+")";
        bookingImageContainer.appendChild(bookingImage);
    }
    let leftArrow = document.querySelector(".attraction-left-arrow");

    let rightArrow = document.querySelector(".attraction-right-arrow");

    let bookingImages = document.querySelectorAll(".booking-image");
    let bookingImagesLength = bookingImages[0].clientWidth;
    console.log("bookingImagesLength: " + bookingImagesLength);
    let scrollPosition = 0;

    leftArrow.addEventListener("mousedown",() =>{
           bookingImageContainer.scrollBy({left: -bookingImagesLength, behavior: 'smooth'}); 
           scrollPosition -= bookingImagesLength;
           console.log("scrollPosition: "+scrollPosition);
           if(scrollPosition < 0){
            scrollPosition = item.images.length*bookingImagesLength;
            bookingImageContainer.scrollTo({
                left: item.images.length * bookingImagesLength,
                behavior: 'smooth'
            });
        }
    });

    rightArrow.addEventListener("mousedown",() =>{
            bookingImageContainer.scrollBy({left: bookingImagesLength, behavior: 'smooth'});
            scrollPosition += bookingImagesLength;
            if(scrollPosition >= item.images.length*bookingImagesLength){
                scrollPosition = 0;
                bookingImageContainer.scrollTo({
                    left: 0 * bookingImagesLength,
                    behavior: 'smooth'
                });
            }
            console.log("scrollPosition: "+scrollPosition);
    });

    let contentContainer = document.querySelector(".attraction-content-container");

    let attractionNameContainer = document.querySelector(".attraction-name-container");

    let attractionName = document.createTextNode(item.name);
    attractionNameContainer.appendChild(attractionName);

    let catContainer = document.querySelector(".cat-container");

    let catName = document.createTextNode(item.category+"at"+item.mrt);
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

    //contentContainer.appendChild(attractionNameContainer);
    //contentContainer.appendChild(catContainer);
    bookingContainer.appendChild(contentContainer);
    
    let carouselIndicators = document.querySelector(".carousel-indicators");
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

    function updateIndicators(activeIndex) {
        let indicators = document.querySelectorAll(".carousel-indicator");
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle("active", index === activeIndex);
        });
    }

    function updateIndicatorsOnScroll() {
        let scrollLeft = bookingImageContainer.scrollLeft;
        let activeIndex;
        activeIndex = Math.round(scrollLeft / bookingImagesLength);
        updateIndicators(activeIndex);
    }
})
.catch(error => {
    console.log(error);
    window.location.href = `/`;
});

const prices = {
    morning: 2000,
    afternoon: 2500
};

const timeRadios = document.querySelectorAll('input[name="time"]');
const priceDiv = document.querySelector('.price');

for (let radio of timeRadios){
    radio.addEventListener('change', function() {
        console.log(this); 
        const selectedPrice = prices[this.value];
        priceDiv.textContent = `新台幣 ${selectedPrice} 元`;
    });
};

let taipeiTripButton = document.querySelector(".taipei-trip");
taipeiTripButton.addEventListener("click",() => {
    window.location.href = `/`;
});
