const baseUrl = "https://remitademo.net/remita/exapp/api/v1/send/api";

const urls = {
   tokenUrl: `${baseUrl}/uaasvc/uaa/token`,
   invoiceUrl: `${baseUrl}/echannelsvc/merchant/api/paymentinit`,
   paymentUrl: "https://www.remitademo.net/remita/ecomm/finalize.reg",
   webhookUrl: "https://webhook.site/8ea3d50b-00d2-4f64-bf88-cea393197f24"
};

const credentials = {
    username: "K9U6PFCLIID7MAN5",
    password: "5D5QVBNDMXU56TEWTO1QTXPOGOZL4TRV",
    merchantId: "2547916",
    apiKey: "1946",
    serviceTypeId: "4430731"
};

module.exports = { urls, credentials };
