const bookingModule = {
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
        let accessToken = localStorage.getItem('accessToken');
        fetch('/api/booking', {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json', 
            }
        })
        .then(response => response.json())
        .then(data => {
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
  };    

export default bookingModule;