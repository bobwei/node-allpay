## AllPay 全方位金流介接 SDK for Node.js

[![NPM version](https://badge.fury.io/js/allpay.svg)](https://npmjs.org/package/allpay)
[![Build Status](https://travis-ci.org/CalvertYang/node-allpay.svg)](https://travis-ci.org/CalvertYang/node-allpay)

[![NPM status](https://nodei.co/npm/allpay.png?downloads=true&stars=true)](https://npmjs.org/package/allpay)

## 安裝方式

建議使用 Node.js 套件管理工具 [npm](http://npmjs.org) 安裝。

```sh
$ npm install allpay
```

## 使用方式

#### 初始化

安裝完畢後，你可以使用 `require` 載入套件：

```js
var Allpay = require("allpay");
```

```js
var allpay = new Allpay({
  merchantID: "YOUR_MERCHANT_ID",
  hashKey: "YOUR_HASH_KEY",
  hashIV: "YOUR_HASH_IV",
  mode: "test",
  debug: false
});
```

`merchantID`：**必填**，廠商編號 (由 AllPay 提供)

`hashKey`：**必填**，全方位金流介接的 HashKey。

`hashIV`：**必填**，全方位金流介接的 HashIV。

`mode`：**選填**，於生產環境使用時請設定為 "production" (預設為 "test")

`debug`：**選填**，設為 true 可查看除錯訊息 (預設為 false)

## 支援以下功能

 * [設定連線](#setHost)：`allpay.setHost(options)`
 * [取得目前設定](#getConfig)：`allpay.getConfig()`
 * [訂單產生](#aioCheckOut)：`allpay.aioCheckOut(options, callback)`
 * [訂單查詢](#queryTradeInfo)：`allpay.queryTradeInfo(options, callback)`
 * [信用卡定期定額訂單查詢](#queryCreditCardPeriodInfo)：`allpay.queryCreditCardPeriodInfo(options, callback)`
 * [信用卡關帳／退刷／取消／放棄](#doAction)：`allpay.doAction(options, callback)`
 * [廠商通知退款](#aioChargeback)：`allpay.aioChargeback(options, callback)`
 * [廠商申請撥款/退款](#capture)：`allpay.capture(options, callback)`
 * [產生交易檢查碼](#genCheckMacValue)：`allpay.genCheckMacValue(data, encryptType)`
 * [驗證資料正確性](#isDataValid)：`allpay.isDataValid(data, encryptType)`

---------------
## 使用範例

<a name="setHost"></a>
#### 設定連線（非必要）

```js
allpay.setHost({
  host: "payment-stage.allpay.com.tw",
  port: 80,
  useSSL: false
});
```

> `host`：**選填**，介接網址 (預設為 payment-stage.allpay.com.tw)
>
> `port`：**選填**，連接埠 (預設為 443)
>
> `useSSL`：**選填**，使用 SSL 連線 (預設為 true)

<a name="getConfig"></a>
#### 取得目前設定

```js
var config = allpay.getConfig();
```

<a name="aioCheckOut"></a>
#### 訂單產生

> 商品參數設定：
```js
Items: [{
  name: "商品名稱",
  price: 商品單價,
  currency: "幣別單位",
  quantity: 商品數量
}]
```
> 發票商品內容參數設定：
```js
InvoiceItems: [{
  name: "商品名稱",
  count: 商品數量,
  word: "商品單位",
  price: 商品單價,
  taxType: "商品課稅別"
}]
```
> 額外可用參數：
>
> `paymentButton`：**選填**，表單按鈕要顯示的文字。(若沒有設定此參數，所產生的表單會包含自動送出的語法)

 * 一般交易

  ```js
  allpay.aioCheckOut({
    MerchantTradeNo: "TS20160502000001",
    MerchantTradeDate: "2016/05/02 00:00:00",
    TotalAmount: 100,
    TradeDesc: "商城購物測試",
    Items: [{
      name: "商品一",
      price: 100,
      currency: "元",
      quantity: 1
    }],
    ReturnURL: "http://localhost/receive",
    ChoosePayment: "ALL"
  }, function(err, result) {
    // Do something here...
  });
  ```

 * 一般交易(含電子發票)

 ```js
 allpay.aioCheckOut({
   MerchantTradeNo: "TS20160502000001",
   MerchantTradeDate: "2016/05/02 00:00:00",
   TotalAmount: 100,
   TradeDesc: "商城購物測試",
   Items: [{
     name: "商品一",
     price: 100,
     currency: "元",
     quantity: 1
   }],
   ReturnURL: "http://localhost/receive",
   ChoosePayment: "ALL",
   InvoiceMark: "Y",
   RelateNumber: "TS20160502000001",
   CustomerEmail: "test@localhost.com",
   TaxType: "1",
   InvoiceItems: [{
     name: "商品一",
     count: 1,
     word: "個",
     price: 100,
     taxType: "1"
   }],
   InvType: "07"
 }, function(err, result) {
   // Do something here...
 });
 ```

 * 信用卡定期定額

  ```js
  allpay.aioCheckOut({
    MerchantTradeNo: "TS20160502000001",
    MerchantTradeDate: "2016/05/02 00:00:00",
    TotalAmount: 100,
    TradeDesc: "商城購物測試",
    Items: [{
      name: "商品一",
      price: 100,
      currency: "元",
      quantity: 1
    }],
    ReturnURL: "http://localhost/receive",
    ChoosePayment: "Credit",
    PeriodAmount: 100,
    PeriodType: "M",
    Frequency: 1,
    ExecTimes: 6,
  }, function(err, result) {
    // Do something here...
  });
  ```

 * 回應內容

  ```js
  {
    url: 'https://payment-stage.allpay.com.tw/Cashier/AioCheckOut/V2',
    data: {
      MerchantID: '2000214',
      MerchantTradeNo: 'TS20160502000001',
      MerchantTradeDate: '2016/05/02 00:00:00',
      PaymentType: 'aio',
      TotalAmount: 100,
      TradeDesc: '商城購物測試',
      ItemName: '商品一 100 元 x 1',
      ReturnURL: 'http://localhost/receive',
      ChoosePayment: 'ALL',
      CheckMacValue: '5D6D710C359E8ACC20069C2FFFE34F24'
    },
    html: '<form id="_allpayForm" method="post" target="_self" action="https://payment-stage.allpay.com.tw/Cashier/AioCheckOut/V2"><input type="hidden" name="MerchantID" value="2000214" /><input type="hidden" name="MerchantTradeNo" value="TS20160502000001" /><input type="hidden" name="MerchantTradeDate" value="2016/05/02 00:00:00" /><input type="hidden" name="PaymentType" value="aio" /><input type="hidden" name="TotalAmount" value="100" /><input type="hidden" name="TradeDesc" value="商城購物測試" /><input type="hidden" name="ItemName" value="商品一 100 元 x 1" /><input type="hidden" name="ReturnURL" value="http://localhost/receive" /><input type="hidden" name="ChoosePayment" value="ALL" /><input type="hidden" name="CheckMacValue" value="5D6D710C359E8ACC20069C2FFFE34F24" /><script type="text/javascript">document.getElementById("_allpayForm").submit();</script></form>'
  }
  ```

<a name="queryTradeInfo"></a>
#### 訂單查詢

```js
allpay.queryTradeInfo({
  MerchantTradeNo: "TS20160502000001"
}, function(err, result) {
  // Do something here...
});
```

回應內容
```js
{
  HandlingCharge: '5',
  ItemName: '商品一 100 元 x1',
  MerchantID: '2000214',
  MerchantTradeNo: 'TS20160502000001',
  PayAmt: '0',
  PaymentDate: '2016/05/02 00:01:23',
  PaymentType: 'Credit_CreditCard',
  PaymentTypeChargeFee: '5',
  RedeemAmt: '0',
  TradeAmt: '100',
  TradeDate: '2016/05/02 00:00:00',
  TradeNo: '1605020000459168',
  TradeStatus: '1',
  CheckMacValue: 'ABE4DDCB8F9895B7FD33858EFB095422'
}
```

<a name="queryCreditCardPeriodInfo"></a>
#### 信用卡定期定額訂單查詢

```js
allpay.queryCreditCardPeriodInfo({
  MerchantTradeNo: "TS20160502000001"
}, function(err, result) {
  // Do something here...
});
```

回應內容
```js
{
  ExecStatus: '1',
  MerchantID: '2000214',
  MerchantTradeNo: 'TS20160502000001',
  TradeNo: '1605020000459168',
  RtnCode: 1,
  PeriodType: 'M',
  Frequency: 1,
  ExecTimes: 6,
  PeriodAmount: 100,
  amount: 100,
  gwsr: 10530824,
  process_date: '2016/05/02 00:01:23',
  auth_code: '777777',
  card4no: '2222',
  card6no: '431195',
  TotalSuccessTimes: 1,
  TotalSuccessAmount: 100,
  ExecLog: [{
    RtnCode: 1,
    amount: 100,
    gwsr: 10530824,
    process_date: '2016/05/02 00:01:23',
    auth_code: '777777'
  }]
}
```

<a name="doAction"></a>
#### 信用卡關帳／退刷／取消／放棄

```js
allpay.doAction({
  MerchantTradeNo: "TS20160502000001",
  TradeNo: "1605020000459168",
  Action: "C",
  TotalAmount: 100,
}, function(err, result) {
  // Do something here...
});
```

回應內容
```js
{
  MerchantID: '2000214'
  MerchantTradeNo: 'TS20160502000001',
  TradeNo: '1605020000459168',
  RtnCode: '1',
  RtnMsg: 'OK'
}
```

<a name="aioChargeback"></a>
#### 廠商通知退款

```js
allpay.aioChargeback({
  MerchantTradeNo: "TS20160502000001",
  TradeNo: "1605020000459168",
  ChargeBackTotalAmount: 100,
}, function(err, result) {
  // Do something here...
});
```

回應內容
```js
{
  status: '1',
  message: 'OK'
}
```

<a name="capture"></a>
#### 廠商申請撥款/退款

```js
allpay.capture({
  MerchantTradeNo: "TS20160502000001",
  CaptureAMT: 100,
  UserRefundAMT: 0,
}, function(err, result) {
  // Do something here...
});
```

回應內容
```js
{
  MerchantID: '2000214',
  MerchantTradeNo: 'TS20160502000001',
  TradeNo: '1605020000459168',
  RtnCode: '1',
  RtnMsg: 'OK',
  AllocationDate: '2016-05-05'
}
```

<a name="genCheckMacValue"></a>
#### 產生交易檢查碼

> `encryptType`：**選填**，加密類型 (預設為 MD5)

 * MD5 加密

  ```js
  var checkMacValue = allpay.genCheckMacValue({
    MerchantID: "2000214",
    MerchantTradeNo: "TS20160502000001",
    MerchantTradeDate: "2016/05/02 00:00:00",
    PaymentType: "aio",
    TotalAmount: 100,
    TradeDesc: "商城購物測試",
    ItemName: "商品一 100 元 x1",
    ReturnURL: "http://localhost/receive",
    ChoosePayment: "ALL",
    NeedExtraPaidInfo: "N",
    DeviceSource: "P",
  });
  ```

 * SHA256 加密

  ```js
  var checkMacValue = allpay.genCheckMacValue({
   MerchantID: "2000214",
   MerchantTradeNo: "TS20160502000001",
   MerchantTradeDate: "2016/05/02 00:00:00",
   PaymentType: "aio",
   TotalAmount: 100,
   TradeDesc: "商城購物測試",
   ItemName: "商品一 100 元 x1",
   ReturnURL: "http://localhost/receive",
   ChoosePayment: "ALL",
   NeedExtraPaidInfo: "N",
   DeviceSource: "P",
 }, "SHA256");
  ```

<a name="isDataValid"></a>
#### 驗證資料正確性

> `encryptType`：**選填**，加密類型 (預設為 MD5)

 * 使用 MD5 加密來驗證資料

  ```js
  var isDataValid = allpay.isDataValid({
    HandlingCharge: "5",
    ItemName: "商品一 100 元 x1",
    MerchantID: "2000214",
    MerchantTradeNo: "TS20160502000001",
    PayAmt: "0",
    PaymentDate: "2016/05/02 00:01:23",
    PaymentType: "Credit_CreditCard",
    PaymentTypeChargeFee: "5",
    RedeemAmt: "0",
    TradeAmt: "100",
    TradeDate: "2016/05/02 00:00:00",
    TradeNo: "1605020000459168",
    TradeStatus: "1",
    CheckMacValue: "ABE4DDCB8F9895B7FD33858EFB095422"
  });
  ```

 * 使用 SHA256 加密來驗證資料

  ```js
  allpay.isDataValid({
   HandlingCharge: "5",
   ItemName: "商品一 100 元 x1",
   MerchantID: "2000214",
   MerchantTradeNo: "TS20160502000001",
   PayAmt: "0",
   PaymentDate: "2016/05/02 00:01:23",
   PaymentType: "Credit_CreditCard",
   PaymentTypeChargeFee: "5",
   RedeemAmt: "0",
   TradeAmt: "100",
   TradeDate: "2016/05/02 00:00:00",
   TradeNo: "1605020000459168",
   TradeStatus: "1",
   CheckMacValue: "2DF1D23B841F2C8E9816F675A3FC6C77B92A92EC78E9BCF898B0C77ADF39DD7D"
 }, "SHA256");
  ```

---

#### Callback

Callback 會返回 2 個參數，分別為 error 和一個 JSON 物件。

以下為範例 callback 函數：

```js
function callback (err, response) {
  if (err) {
    console.log(err);
  } else {
    console.dir(response);
  }
}
```

---

詳細參數說明請參閱[全方位金流API介接技術文件](https://www.allpay.com.tw/Service/API_Dwnld?Anchor=Payment)。

## License

MIT

![Analytics](https://ga-beacon.appspot.com/UA-44933497-3/CalvertYang/node-allpay?pixel)
