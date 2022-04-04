const baseUrl = "https://remitademo.net/remita/exapp/api/v1/send/api";

const urls = {
   tokenUrl: `${baseUrl}/uaasvc/uaa/token`,
   invoiceUrl: `${baseUrl}/echannelsvc/merchant/api/paymentinit`,
   paymentUrl: "https://www.remitademo.net/remita/ecomm/finalize.reg",
   webhookUrl: "https://www.iwxcollections.ml/webhook"
};

const credentials = {
    username: "K9U6PFCLIID7MAN5",
    password: "5D5QVBNDMXU56TEWTO1QTXPOGOZL4TRV",
    merchantId: "2547916",
    apiKey: "1946",
    serviceTypeId: "4430731"
};

module.exports = { urls, credentials };
