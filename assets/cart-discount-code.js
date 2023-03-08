let clearBtn = document.querySelector("#clear-discount-btn");
let applyBtn = document.querySelector("#apply-discount-btn");
let discountCodeError = document.querySelector("#discount-code-error");
let discountCodeWrapper = document.querySelector("#applied-discount-code .applied-discount-code-wrapper");
let discountCodeValue = document.querySelector("#applied-discount-code .applied-discount-code-value");
let discountCodeInput = document.querySelector("#discount-code-input");
let totalCartSelector = document.querySelector(".totals__subtotal-value span.money"); // Total Cart Selector to update the total amount. 
let authorization_token;
  
let checkoutContainer = document.createElement('div');
document.body.appendChild(checkoutContainer);
if (localStorage.discountCode) applyDiscount( JSON.parse(localStorage.discountCode).code);
discountCodeInput.addEventListener("change", function(e){
  e.preventDefault()
  applyDiscount(discountCodeInput.value);
});

applyBtn.addEventListener("click", function(e){
  e.preventDefault()
  applyDiscount(discountCodeInput.value);
});
clearBtn.addEventListener("click", function(e){
  e.preventDefault()
  clearDiscount();
});
function clearDiscount() {
  discountCodeValue.innerHTML = "";
  discountCodeError.innerHTML = "";
  clearLocalStorage();
  fetch("/discount/CLEAR");
}
function clearLocalStorage() {
  discountCodeWrapper.style.display = "none";
  totalCartSelector.innerHTML = JSON.parse(localStorage.discountCode).totalCart;
  localStorage.removeItem("discountCode");
}
function applyDiscount(code) {
  applyBtn.innerHTML = "APPLYING <div class='loader'></div>";
  applyBtn.style.pointerEvents = "none";
  let discountApplyUrl = "/discount/"+code+"?v="+Date.now()+"&redirect=/checkout/";
  fetch(discountApplyUrl, {}).then(function(response) { return response.text(); })
  .then(function(data) {
    checkoutContainer.innerHTML = data;
    const checkout_json_url = '/wallets/checkouts/';
    authorization_token = checkoutContainer.querySelector('[data-serialized-id="shopify-checkout-api-token"]').getAttribute('data-serialized-value').replace('\\n', '=').replaceAll('"', '');
    fetch('/cart.js', {}).then(function(res){return res.json();})
    .then(function(data){
      let body = {"checkout": {"discount_code": code,"line_items": data.items}}
      fetch(checkout_json_url, {
        "headers": {
          "accept": "*/*", "cache-control": "no-cache",
          "authorization": "Basic " + authorization_token,
          "content-type": "application/json, text/javascript",
          "pragma": "no-cache", "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin"
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "method": "POST", "mode": "cors", "credentials": "include",
        "body": JSON.stringify(body)
    })
    .then(function(response) { return response.json() })
    .then(function(data) {
      console.log(data.checkout);
      if(data.checkout && data.checkout.applied_discounts.length > 0){
        discountCodeWrapper.style.display = "inline";
        discountCodeError.innerHTML = "";
        discountCodeValue.innerHTML = data.checkout.applied_discounts[0].title + " (" + data.checkout.applied_discounts[0].amount*100 + ")";
        let localStorageValue = {
          'code': code.trim(),
          'totalCart': data.checkout.total_line_items_price
        };
        localStorage.setItem("discountCode", JSON.stringify(localStorageValue));
        console.log(totalCartSelector)
        totalCartSelector.innerHTML = "<s>" + data.checkout.total_line_items_price + "</s>" + data.checkout.total_price;
      }else{
        discountCodeValue.innerHTML = "";
        clearLocalStorage();
        discountCodeError.innerHTML = "Please Enter Valid Coupon Code."
      }
    }).finally(function(params) {
      applyBtn.innerHTML = "APPLY";
      applyBtn.style.pointerEvents = "all";
    });
  });
});
}