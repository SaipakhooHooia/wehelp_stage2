let greeting = document.querySelector(".greeting");
let contactName = document.querySelector(".contact-name");
let contactEmail = document.querySelector(".contact-email");
let loginState = false;
let logout = document.querySelector(".logout");
let loginSignupLink = document.querySelector(".login-signup");
export async function user_data() {
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
      greeting.textContent = `您好， ${data.name}，待預定的行程如下:`;
      contactName.value = data.name;
      contactEmail.value = data.email;
    }
  } 
  catch (error) {
    console.error('There was a problem with your fetch operation:', error);
    loginState = false;
  }
}

export default{
    user_data:user_data
};