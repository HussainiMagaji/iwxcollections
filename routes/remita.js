const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const SHA512 = require("crypto-js/sha512");
const { urls, credentials } = require("../routes/credentials.js");



function jsonp(json) { return json; }

function generateHash(credentials, user) {
    let hashParams = credentials.merchantId + user.RRR + credentials.apiKey;
    return String(SHA512(hashParams));
}

function generateConsumerToken(credentials, user) {
    user.orderId = String(new Date( ).getTime( ));
    const tokenParams = (credentials.merchantId + credentials.serviceTypeId + user.orderId + user.amount + credentials.apiKey);
    return String(SHA512(tokenParams));
}

function initiatePayment(urls, credentials, user) {
    return (
      `<form action="${urls.paymentUrl}" name="SubmitRemitaForm" method="POST">
          <img src="https://www.remita.net/assets/minimal/images/remita_orange_new_logo.svg"><br>
	  <input name="merchantId" value="${credentials.merchantId}" type="hidden">
	  <input name="hash" value="${generateHash(credentials, user)}" type="hidden">
	  <input name="rrr" value="${user.RRR}" type="hidden">
	  <input name="responseurl" value="${urls.webhookUrl}" type="hidden">
	  <input type="submit" name="submit_btn" value="Pay Via Remita">
       </form>`);
}

async function generateRRR(urls, credentials, user) {

    let options = {
	  method: "POST",
	  headers: {
	  "Content-Type": "application/json",
	  Authorization: `remitaConsumerKey=${credentials.merchantId},remitaConsumerToken=${generateConsumerToken(credentials, user)}`
          },
	  body: JSON.stringify({
               serviceTypeId: credentials.serviceTypeId,
               amount: user.amount,
               orderId: user.orderId,
               payerName: user.name,
               payerEmail: user.email,
               payerPhone: user.phone,
               description: "Items checkout payment",
	       customFields: [
	           {
		      name: "State",
		      value: user.state,
		      type: "String"
	           },
	           {
		      name: "LGA",
		      value: user.lga,
		      type: "String"
	           },
	           {
		      name: "Address",
		      value: user.address,
		      type: "String"
	           }
	       ]
          })
    };

    let response, resObj; 
    try {
	response = await fetch(urls.invoiceUrl, options);
	resObj = await response.text( );
	return eval(resObj);
    } catch(err) { 
	return (resObj)? resObj: JSON.stringify({ name: err.name, message: err.message }); 
    };
}



module.exports = {
    generateRRR(user) {
	return generateRRR(urls, credentials, user);
    },
    initiatePayment(user) {
	return initiatePayment(urls, credentials, user);
    }
};
