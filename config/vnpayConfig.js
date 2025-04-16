/**
 * Cấu hình VNPay
 */
module.exports = {
  // Terminal ID được cấp bởi VNPay
  vnp_TmnCode: "WVHCBEIS",
  
  // Khóa bí mật để tạo chữ ký
  vnp_HashSecret: "G835F4FT2LR70GPLQLDMVYRIJHN2YUPT",
  
  // URL thanh toán VNPay Sandbox
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  
  // URL API VNPay Sandbox
  vnp_Api: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  
  // URL trả về sau khi thanh toán
  vnp_ReturnUrl: "http://localhost:3000/v1/api/test-vnpay/callback",
  
  // URL nhận thông báo IPN từ VNPay
  vnp_IpnUrl: "http://localhost:3000/v1/api/test-vnpay/ipn"
}; 