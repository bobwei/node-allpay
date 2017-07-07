"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // dependencies


var _util = require("util");

var _util2 = _interopRequireDefault(_util);

var _crypto = require("crypto");

var _crypto2 = _interopRequireDefault(_crypto);

var _http = require("http");

var _http2 = _interopRequireDefault(_http);

var _https = require("https");

var _https2 = _interopRequireDefault(_https);

var _querystring = require("querystring");

var _querystring2 = _interopRequireDefault(_querystring);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * API 查詢端點
 *
 * @constant {object}
 */
var ENDPOINT = {
  // 訂單產生
  aioCheckOut: "/Cashier/AioCheckOut/V2",
  // 訂單查詢
  queryTradeInfo: "/Cashier/QueryTradeInfo/V2",
  // 信用卡定期定額訂單查詢
  queryCreditCardPeriodInfo: "/Cashier/QueryCreditCardPeriodInfo",
  // 信用卡關帳/退刷/取消/放棄
  doAction: "/CreditDetail/DoAction",
  // 廠商通知退款
  aioChargeback: "/Cashier/AioChargeback",
  // 廠商申請撥款/退款
  capture: "/Cashier/Capture"
};

/**
 * 回傳值非 JSON 物件之 API 查詢端點
 *
 * @constant {string[]}
 */
var NON_JSON_RESPONSE_ENDPOINT = [ENDPOINT.aioCheckOut, ENDPOINT.queryTradeInfo, ENDPOINT.doAction, ENDPOINT.aioChargeback, ENDPOINT.capture];

/**
 * API 錯誤訊息
 *
 * @constant {object}
 */
var ERROR_MESSAGE = {
  initializeRequired: "Allpay has not been initialized.",
  wrongParameter: "Wrong parameter.",
  requiredParameter: "%s is required.",
  lengthLimitation: "The maximum length for %s is %d.",
  fixedLengthLimitation: "The length for %s should be %d.",
  removeParameter: "Please remove %s.",
  invalidParameter: "%s should be %s.",
  wrongDataFormat: "The %s data format is wrong.",
  cannotBeEmpty: "%s cannot be empty.",
  notSupported: "This feature is not supported in test mode."
};

/**
 * 主機位址
 *
 * @constant {object}
 */
var HOST = {
  production: "payment.allpay.com.tw",
  test: "payment-stage.allpay.com.tw"
};

/**
 * 設定
 *
 * @property {string} merchantID - 廠商編號
 * @property {string} hashKey - HashKey
 * @property {string} hashIV - HashIV
 * @property {string} baseUrl - API base url
 * @property {boolean} useSSL - 是否使用 SSL 連線
 * @property {string} mode - "production" 或 "test"
 * @property {boolean} debug - 顯示除錯訊息
 * @property {boolean} initialized - 初始化標記
 * @private
 */
var CONFIG = {
  merchantID: "",
  hashKey: "",
  hashIV: "",
  mode: "test",
  debug: false,
  host: HOST.test,
  port: 443,
  useSSL: true,
  isInitialized: false
};

var Allpay = function () {

  /**
   * 建構子
   */
  function Allpay() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        merchantID = _ref.merchantID,
        hashKey = _ref.hashKey,
        hashIV = _ref.hashIV,
        mode = _ref.mode,
        debug = _ref.debug;

    _classCallCheck(this, Allpay);

    if (typeof merchantID === "undefined") {
      var errorMsg = genErrorMessage(ERROR_MESSAGE.requiredParameter, "merchantID");
      return sendErrorResponse(errorMsg);
    }
    if (typeof merchantID !== "string") {
      var _errorMsg = genErrorMessage(ERROR_MESSAGE.invalidParameter, "merchantID", "string");
      return sendErrorResponse(_errorMsg);
    }
    if (merchantID.length > 10) {
      var _errorMsg2 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "merchantID", 10);
      return sendErrorResponse(_errorMsg2);
    }
    CONFIG.merchantID = merchantID;

    if (typeof hashKey === "undefined") {
      var _errorMsg3 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "hashKey");
      return sendErrorResponse(_errorMsg3);
    }
    if (typeof hashKey !== "string") {
      var _errorMsg4 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "hashKey", "string");
      return sendErrorResponse(_errorMsg4);
    }
    CONFIG.hashKey = hashKey;

    if (typeof hashIV === "undefined") {
      var _errorMsg5 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "hashIV");
      return sendErrorResponse(_errorMsg5);
    }
    if (typeof hashIV !== "string") {
      var _errorMsg6 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "hashIV", "string");
      return sendErrorResponse(_errorMsg6);
    }
    CONFIG.hashIV = hashIV;

    if (typeof mode !== "undefined") {
      if (typeof mode !== "string") {
        var _errorMsg7 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "mode", "string");
        return sendErrorResponse(_errorMsg7);
      }
      if (["test", "production"].indexOf(mode) === -1) {
        var _errorMsg8 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "mode", "'test' or 'production'");
        return sendErrorResponse(_errorMsg8);
      }

      CONFIG.mode = mode;
    }

    if (typeof debug !== "undefined") {
      if (typeof debug !== "boolean") {
        var _errorMsg9 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "debug", "boolean");
        return sendErrorResponse(_errorMsg9);
      }

      CONFIG.debug = debug;
    }

    CONFIG.host = mode === "production" ? HOST.production : HOST.test;

    if (!(this instanceof Allpay)) {
      return new Allpay(opts);
    }

    this.version = require("../package.json").version;

    CONFIG.isInitialized = true;

    log("==================================================");
    log("Allpay SDK config");
    log("==================================================");
    log(CONFIG);
  }

  /**
   * 設定連線參數
   *
   * @param {string} host - 選填. 主機位址
   * @param {string} port - 選填. 通訊埠
   * @param {boolean} useSSL - 選填. 是否使用 SSL 連線
   */


  _createClass(Allpay, [{
    key: "setHost",
    value: function setHost() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          host = _ref2.host,
          port = _ref2.port,
          useSSL = _ref2.useSSL;

      if (host !== undefined) {
        if (typeof host !== "string") {
          var errorMsg = genErrorMessage(ERROR_MESSAGE.invalidParameter, "host", "string");
          return sendErrorResponse(errorMsg);
        }

        CONFIG.host = host;
      }

      if (port !== undefined) {
        if (!Number.isInteger(port)) {
          var _errorMsg10 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "port", "number");
          return sendErrorResponse(_errorMsg10);
        }

        CONFIG.port = port;
      }

      if (useSSL !== undefined) {
        if (typeof useSSL !== "boolean") {
          var _errorMsg11 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "useSSL", "boolean");
          return sendErrorResponse(_errorMsg11);
        }

        CONFIG.useSSL = useSSL;
      }

      log("==================================================");
      log("Current host data");
      log("==================================================");
      log("Host: " + CONFIG.host + "\nPort: " + CONFIG.port + "\nUse SSL: " + CONFIG.useSSL);
    }

    /**
     * 取得目前設定
     */

  }, {
    key: "getConfig",
    value: function getConfig() {
      log("==================================================");
      log("Current config data");
      log("==================================================");
      log(JSON.stringify(CONFIG, null, 2));

      return CONFIG;
    }

    /**
     * 訂單產生
     *
     * @param {object} opts - 訂單產生相關參數，請參考「全方位金流API介接技術文件」
     * @param {requestCallback} callback - 處理回應的 callback
     */

  }, {
    key: "aioCheckOut",
    value: function aioCheckOut(opts) {
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      var data = {};

      // 參數檢查
      if ((typeof opts === "undefined" ? "undefined" : _typeof(opts)) !== "object") {
        return sendErrorResponse(new Error(ERROR_MESSAGE.wrongParameter), callback);
      }

      if (!opts.hasOwnProperty("MerchantTradeNo")) {
        var errorMsg = genErrorMessage(ERROR_MESSAGE.requiredParameter, "MerchantTradeNo");
        return sendErrorResponse(errorMsg, callback);
      }
      if (typeof opts.MerchantTradeNo !== "string") {
        var _errorMsg12 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "MerchantTradeNo", "string");
        return sendErrorResponse(_errorMsg12, callback);
      }
      if (opts.MerchantTradeNo.length > 20) {
        var _errorMsg13 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "MerchantTradeNo", 20);
        return sendErrorResponse(_errorMsg13, callback);
      }

      if (!opts.hasOwnProperty("MerchantTradeDate")) {
        var _errorMsg14 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "MerchantTradeDate");
        return sendErrorResponse(_errorMsg14, callback);
      }
      if (typeof opts.MerchantTradeDate !== "string") {
        var _errorMsg15 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "MerchantTradeDate", "string");
        return sendErrorResponse(_errorMsg15, callback);
      }

      if (opts.MerchantTradeDate.length > 20) {
        var _errorMsg16 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "MerchantTradeDate", 20);
        return sendErrorResponse(_errorMsg16, callback);
      }

      //
      // NOTE: 2016/05/04 - 目前預設自動帶入 aio
      //
      // if (!opts.hasOwnProperty("PaymentType")) {
      //   let errorMsg = genErrorMessage(ERROR_MESSAGE.requiredParameter, "PaymentType");
      //   return sendErrorResponse(errorMsg, callback);
      // }
      // if (typeof opts.PaymentType !== "string") {
      //   let errorMsg = genErrorMessage(ERROR_MESSAGE.invalidParameter, "PaymentType", "string");
      //   return sendErrorResponse(errorMsg, callback);
      // }
      // if (opts.PaymentType.length > 20) {
      //   let errorMsg = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "PaymentType", 20);
      //   return sendErrorResponse(errorMsg, callback);
      // }

      if (!opts.hasOwnProperty("TotalAmount")) {
        var _errorMsg17 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "TotalAmount");
        return sendErrorResponse(_errorMsg17, callback);
      }
      if (!Number.isInteger(opts.TotalAmount)) {
        var _errorMsg18 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "TotalAmount", "number");
        return sendErrorResponse(_errorMsg18, callback);
      }

      if (!opts.hasOwnProperty("TradeDesc")) {
        var _errorMsg19 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "TradeDesc");
        return sendErrorResponse(_errorMsg19, callback);
      }
      if (typeof opts.TradeDesc !== "string") {
        var _errorMsg20 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "TradeDesc", "string");
        return sendErrorResponse(_errorMsg20, callback);
      }
      if (opts.TradeDesc.length > 200) {
        var _errorMsg21 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "TradeDesc", 200);
        return sendErrorResponse(_errorMsg21, callback);
      }

      if (!opts.hasOwnProperty("Items")) {
        var _errorMsg22 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "Items");
        return sendErrorResponse(_errorMsg22, callback);
      }
      if (!Array.isArray(opts.Items)) {
        var _errorMsg23 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Items", "array");
        return sendErrorResponse(_errorMsg23, callback);
      }
      if (opts.Items.length === 0) {
        var _errorMsg24 = genErrorMessage(ERROR_MESSAGE.cannotBeEmpty, "Items");
        return sendErrorResponse(_errorMsg24, callback);
      }
      opts.Items.forEach(function (item) {
        if (!item.hasOwnProperty("name")) {
          var _errorMsg25 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "Items.name");
          return sendErrorResponse(_errorMsg25, callback);
        }
        if (typeof item.name !== "string") {
          var _errorMsg26 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Items.name", "string");
          return sendErrorResponse(_errorMsg26, callback);
        }

        if (!item.hasOwnProperty("price")) {
          var _errorMsg27 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "Items.price");
          return sendErrorResponse(_errorMsg27, callback);
        }
        if (!Number.isInteger(item.price)) {
          var _errorMsg28 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Items.price", "number");
          return sendErrorResponse(_errorMsg28, callback);
        }

        if (!item.hasOwnProperty("currency")) {
          var _errorMsg29 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "Items.currency");
          return sendErrorResponse(_errorMsg29, callback);
        }
        if (typeof item.currency !== "string") {
          var _errorMsg30 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Items.currency", "string");
          return sendErrorResponse(_errorMsg30, callback);
        }

        if (!item.hasOwnProperty("quantity")) {
          var _errorMsg31 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "Items.quantity");
          return sendErrorResponse(_errorMsg31, callback);
        }
        if (!Number.isInteger(item.quantity)) {
          var _errorMsg32 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Items.quantity", "number");
          return sendErrorResponse(_errorMsg32, callback);
        }
      });

      if (!opts.hasOwnProperty("ReturnURL")) {
        var _errorMsg33 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "ReturnURL");
        return sendErrorResponse(_errorMsg33, callback);
      }
      if (typeof opts.ReturnURL !== "string") {
        var _errorMsg34 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ReturnURL", "string");
        return sendErrorResponse(_errorMsg34, callback);
      }
      if (opts.ReturnURL.length > 200) {
        var _errorMsg35 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "ReturnURL", 200);
        return sendErrorResponse(_errorMsg35, callback);
      }

      if (!opts.hasOwnProperty("ChoosePayment")) {
        var _errorMsg36 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "ChoosePayment");
        return sendErrorResponse(_errorMsg36, callback);
      }
      if (typeof opts.ChoosePayment !== "string") {
        var _errorMsg37 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ChoosePayment", "string");
        return sendErrorResponse(_errorMsg37, callback);
      }
      if (opts.ChoosePayment.length > 20) {
        var _errorMsg38 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "ChoosePayment", 20);
        return sendErrorResponse(_errorMsg38, callback);
      }

      if (opts.hasOwnProperty("ClientBackURL")) {
        if (typeof opts.ClientBackURL !== "string") {
          var _errorMsg39 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ClientBackURL", "string");
          return sendErrorResponse(_errorMsg39, callback);
        }
        if (opts.ClientBackURL.length > 200) {
          var _errorMsg40 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "ClientBackURL", 200);
          return sendErrorResponse(_errorMsg40, callback);
        }
      }

      if (opts.hasOwnProperty("ItemURL")) {
        if (typeof opts.ItemURL !== "string") {
          var _errorMsg41 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ItemURL", "string");
          return sendErrorResponse(_errorMsg41, callback);
        }
        if (opts.ItemURL.length > 200) {
          var _errorMsg42 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "ItemURL", 200);
          return sendErrorResponse(_errorMsg42, callback);
        }
      }

      if (opts.hasOwnProperty("Remark")) {
        if (typeof opts.Remark !== "string") {
          var _errorMsg43 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Remark", "string");
          return sendErrorResponse(_errorMsg43, callback);
        }
        if (opts.Remark.length > 100) {
          var _errorMsg44 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Remark", 100);
          return sendErrorResponse(_errorMsg44, callback);
        }
      }

      if (opts.hasOwnProperty("ChooseSubPayment")) {
        if (typeof opts.ChooseSubPayment !== "string") {
          var _errorMsg45 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ChooseSubPayment", "string");
          return sendErrorResponse(_errorMsg45, callback);
        }
        if (opts.ChooseSubPayment.length > 20) {
          var _errorMsg46 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "ChooseSubPayment", 20);
          return sendErrorResponse(_errorMsg46, callback);
        }
      }

      if (opts.hasOwnProperty("OrderResultURL")) {
        if (typeof opts.OrderResultURL !== "string") {
          var _errorMsg47 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "OrderResultURL", "string");
          return sendErrorResponse(_errorMsg47, callback);
        }
        if (opts.OrderResultURL.length > 200) {
          var _errorMsg48 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "OrderResultURL", 200);
          return sendErrorResponse(_errorMsg48, callback);
        }
      }

      if (opts.hasOwnProperty("NeedExtraPaidInfo")) {
        if (typeof opts.NeedExtraPaidInfo !== "string") {
          var _errorMsg49 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "NeedExtraPaidInfo", "string");
          return sendErrorResponse(_errorMsg49, callback);
        }
        if (opts.NeedExtraPaidInfo.length > 1) {
          var _errorMsg50 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "NeedExtraPaidInfo", 1);
          return sendErrorResponse(_errorMsg50, callback);
        }
      }

      if (opts.hasOwnProperty("DeviceSource")) {
        if (typeof opts.DeviceSource !== "string") {
          var _errorMsg51 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "DeviceSource", "string");
          return sendErrorResponse(_errorMsg51, callback);
        }
        if (opts.DeviceSource.length > 10) {
          var _errorMsg52 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "DeviceSource", 10);
          return sendErrorResponse(_errorMsg52, callback);
        }
      }

      if (opts.hasOwnProperty("IgnorePayment")) {
        if (typeof opts.IgnorePayment !== "string") {
          var _errorMsg53 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "IgnorePayment", "string");
          return sendErrorResponse(_errorMsg53, callback);
        }
        if (opts.IgnorePayment.length > 100) {
          var _errorMsg54 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "IgnorePayment", 100);
          return sendErrorResponse(_errorMsg54, callback);
        }
      }

      if (opts.hasOwnProperty("PlatformID")) {
        if (typeof opts.PlatformID !== "string") {
          var _errorMsg55 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "PlatformID", "string");
          return sendErrorResponse(_errorMsg55, callback);
        }
        if (opts.PlatformID.length > 10) {
          var _errorMsg56 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "PlatformID", 10);
          return sendErrorResponse(_errorMsg56, callback);
        }
      }

      if (opts.hasOwnProperty("InvoiceMark")) {
        if (typeof opts.InvoiceMark !== "string") {
          var _errorMsg57 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "InvoiceMark", "string");
          return sendErrorResponse(_errorMsg57, callback);
        }
        if (opts.InvoiceMark.length > 1) {
          var _errorMsg58 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "InvoiceMark", 1);
          return sendErrorResponse(_errorMsg58, callback);
        }
      }

      if (opts.hasOwnProperty("HoldTradeAMT")) {
        if (!Number.isInteger(opts.HoldTradeAMT)) {
          var _errorMsg59 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "HoldTradeAMT", "number");
          return sendErrorResponse(_errorMsg59, callback);
        }
      }

      if (opts.hasOwnProperty("EncryptType")) {
        if (!Number.isInteger(opts.EncryptType)) {
          var _errorMsg60 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "EncryptType", "number");
          return sendErrorResponse(_errorMsg60, callback);
        }
      }

      if (opts.hasOwnProperty("UseRedeem")) {
        if (typeof opts.UseRedeem !== "string") {
          var _errorMsg61 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "UseRedeem", "string");
          return sendErrorResponse(_errorMsg61, callback);
        }
        if (opts.UseRedeem.length > 1) {
          var _errorMsg62 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "UseRedeem", 1);
          return sendErrorResponse(_errorMsg62, callback);
        }
      }

      if (["ATM", "CVS", "BARCODE"].indexOf(opts.ChoosePayment) > -1) {
        if (opts.ChoosePayment === "ATM") {
          if (opts.hasOwnProperty("ExpireDate")) {
            if (!Number.isInteger(opts.ExpireDate)) {
              var _errorMsg63 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ExpireDate", "number");
              return sendErrorResponse(_errorMsg63, callback);
            }
            if (opts.ExpireDate < 1 || opts.ExpireDate > 60) {
              var _errorMsg64 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ExpireDate", "1 ~ 60");
              return sendErrorResponse(_errorMsg64, callback);
            }
          }
        } else {
          if (opts.hasOwnProperty("StoreExpireDate")) {
            if (!Number.isInteger(opts.StoreExpireDate)) {
              var _errorMsg65 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "StoreExpireDate", "number");
              return sendErrorResponse(_errorMsg65, callback);
            }
          }

          if (opts.hasOwnProperty("Desc_1")) {
            if (typeof opts.Desc_1 !== "string") {
              var _errorMsg66 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Desc_1", "string");
              return sendErrorResponse(_errorMsg66, callback);
            }
            if (opts.Desc_1.length > 20) {
              var _errorMsg67 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Desc_1", 20);
              return sendErrorResponse(_errorMsg67, callback);
            }
          }

          if (opts.hasOwnProperty("Desc_2")) {
            if (typeof opts.Desc_2 !== "string") {
              var _errorMsg68 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Desc_2", "string");
              return sendErrorResponse(_errorMsg68, callback);
            }
            if (opts.Desc_2.length > 20) {
              var _errorMsg69 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Desc_2", 20);
              return sendErrorResponse(_errorMsg69, callback);
            }
          }

          if (opts.hasOwnProperty("Desc_3")) {
            if (typeof opts.Desc_3 !== "string") {
              var _errorMsg70 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Desc_3", "string");
              return sendErrorResponse(_errorMsg70, callback);
            }
            if (opts.Desc_3.length > 20) {
              var _errorMsg71 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Desc_3", 20);
              return sendErrorResponse(_errorMsg71, callback);
            }
          }

          if (opts.hasOwnProperty("Desc_4")) {
            if (typeof opts.Desc_4 !== "string") {
              var _errorMsg72 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Desc_4", "string");
              return sendErrorResponse(_errorMsg72, callback);
            }
            if (opts.Desc_4.length > 20) {
              var _errorMsg73 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Desc_4", 20);
              return sendErrorResponse(_errorMsg73, callback);
            }
          }
        }

        if (opts.hasOwnProperty("PaymentInfoURL")) {
          if (typeof opts.PaymentInfoURL !== "string") {
            var _errorMsg74 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "PaymentInfoURL", "string");
            return sendErrorResponse(_errorMsg74, callback);
          }
          if (opts.PaymentInfoURL.length > 200) {
            var _errorMsg75 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "PaymentInfoURL", 200);
            return sendErrorResponse(_errorMsg75, callback);
          }
        }

        if (opts.hasOwnProperty("ClientRedirectURL")) {
          if (typeof opts.ClientRedirectURL !== "string") {
            var _errorMsg76 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ClientRedirectURL", "string");
            return sendErrorResponse(_errorMsg76, callback);
          }
          if (opts.ClientRedirectURL.length > 200) {
            var _errorMsg77 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "ClientRedirectURL", 200);
            return sendErrorResponse(_errorMsg77, callback);
          }
        }
      }

      if (opts.ChoosePayment === "Alipay") {
        if (!opts.hasOwnProperty("Email")) {
          var _errorMsg78 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "Email");
          return sendErrorResponse(_errorMsg78, callback);
        }
        if (typeof opts.Email !== "string") {
          var _errorMsg79 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Email", "string");
          return sendErrorResponse(_errorMsg79, callback);
        }
        if (opts.Email.length > 200) {
          var _errorMsg80 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Email", 200);
          return sendErrorResponse(_errorMsg80, callback);
        }

        if (!opts.hasOwnProperty("PhoneNo")) {
          var _errorMsg81 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "PhoneNo");
          return sendErrorResponse(_errorMsg81, callback);
        }
        if (typeof opts.PhoneNo !== "string") {
          var _errorMsg82 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "PhoneNo", "string");
          return sendErrorResponse(_errorMsg82, callback);
        }
        if (opts.PhoneNo.length > 20) {
          var _errorMsg83 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "PhoneNo", 20);
          return sendErrorResponse(_errorMsg83, callback);
        }

        if (!opts.hasOwnProperty("UserName")) {
          var _errorMsg84 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "UserName");
          return sendErrorResponse(_errorMsg84, callback);
        }
        if (typeof opts.UserName !== "string") {
          var _errorMsg85 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "UserName", "string");
          return sendErrorResponse(_errorMsg85, callback);
        }
        if (opts.UserName.length > 20) {
          var _errorMsg86 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "UserName", 20);
          return sendErrorResponse(_errorMsg86, callback);
        }
      }

      if (opts.ChoosePayment === "Tenpay") {
        if (opts.hasOwnProperty("ExpireTime")) {
          if (typeof opts.ExpireTime !== "string") {
            var _errorMsg87 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ExpireTime", "string");
            return sendErrorResponse(_errorMsg87, callback);
          }
          if (opts.ExpireTime.length > 20) {
            var _errorMsg88 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "ExpireTime", 20);
            return sendErrorResponse(_errorMsg88, callback);
          }
        }
      }

      if (opts.ChoosePayment === "Credit") {
        if (opts.hasOwnProperty("CreditInstallment")) {
          if (!Number.isInteger(opts.CreditInstallment)) {
            var _errorMsg89 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "CreditInstallment", "number");
            return sendErrorResponse(_errorMsg89, callback);
          }
        }

        if (opts.hasOwnProperty("InstallmentAmount")) {
          if (!Number.isInteger(opts.InstallmentAmount)) {
            var _errorMsg90 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "InstallmentAmount", "number");
            return sendErrorResponse(_errorMsg90, callback);
          }
        }

        if (opts.hasOwnProperty("Redeem")) {
          if (typeof opts.Redeem !== "string") {
            var _errorMsg91 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Redeem", "string");
            return sendErrorResponse(_errorMsg91, callback);
          }
          if (opts.Redeem.length > 1) {
            var _errorMsg92 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Redeem", 1);
            return sendErrorResponse(_errorMsg92, callback);
          }
        }

        if (opts.hasOwnProperty("UnionPay")) {
          if (!Number.isInteger(opts.UnionPay)) {
            var _errorMsg93 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "UnionPay", "number");
            return sendErrorResponse(_errorMsg93, callback);
          }
        }

        if (opts.hasOwnProperty("Language")) {
          if (typeof opts.Language !== "string") {
            var _errorMsg94 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Language", "string");
            return sendErrorResponse(_errorMsg94, callback);
          }
          if (opts.Language.length > 3) {
            var _errorMsg95 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Language", 3);
            return sendErrorResponse(_errorMsg95, callback);
          }
        }

        if (opts.hasOwnProperty("PeriodAmount")) {
          if (!Number.isInteger(opts.PeriodAmount)) {
            var _errorMsg96 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "PeriodAmount", "number");
            return sendErrorResponse(_errorMsg96, callback);
          }
        }

        if (opts.hasOwnProperty("PeriodType")) {
          if (typeof opts.PeriodType !== "string") {
            var _errorMsg97 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "PeriodType", "string");
            return sendErrorResponse(_errorMsg97, callback);
          }
          if (opts.PeriodType.length > 1) {
            var _errorMsg98 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "PeriodType", 1);
            return sendErrorResponse(_errorMsg98, callback);
          }
        }

        if (opts.hasOwnProperty("Frequency")) {
          if (!Number.isInteger(opts.Frequency)) {
            var _errorMsg99 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Frequency", "number");
            return sendErrorResponse(_errorMsg99, callback);
          }
        }

        if (opts.hasOwnProperty("ExecTimes")) {
          if (!Number.isInteger(opts.ExecTimes)) {
            var _errorMsg100 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ExecTimes", "number");
            return sendErrorResponse(_errorMsg100, callback);
          }
        }

        if (opts.hasOwnProperty("PeriodReturnURL")) {
          if (typeof opts.PeriodReturnURL !== "string") {
            var _errorMsg101 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "PeriodReturnURL", "string");
            return sendErrorResponse(_errorMsg101, callback);
          }
          if (opts.PeriodReturnURL.length > 200) {
            var _errorMsg102 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "PeriodReturnURL", 200);
            return sendErrorResponse(_errorMsg102, callback);
          }
        }
      }

      if (opts.InvoiceMark === "Y") {
        if (!opts.hasOwnProperty("RelateNumber")) {
          var _errorMsg103 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "RelateNumber");
          return sendErrorResponse(_errorMsg103, callback);
        }
        if (typeof opts.RelateNumber !== "string") {
          var _errorMsg104 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "RelateNumber", "string");
          return sendErrorResponse(_errorMsg104, callback);
        }
        if (opts.RelateNumber.length > 30) {
          var _errorMsg105 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "RelateNumber", 30);
          return sendErrorResponse(_errorMsg105, callback);
        }

        if (opts.hasOwnProperty("CarruerType")) {
          if (typeof opts.CarruerType !== "string") {
            var _errorMsg106 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "CarruerType", "string");
            return sendErrorResponse(_errorMsg106, callback);
          }
          if (opts.CarruerType.length > 1) {
            var _errorMsg107 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "CarruerType", 1);
            return sendErrorResponse(_errorMsg107, callback);
          }
        }

        if (opts.CarruerType === "1") {
          if (!opts.hasOwnProperty("CustomerID") || !opts.CustomerID) {
            var _errorMsg108 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "CustomerID");
            return sendErrorResponse(_errorMsg108, callback);
          }
        }
        if (opts.hasOwnProperty("CustomerID")) {
          if (typeof opts.CustomerID !== "string") {
            var _errorMsg109 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "CustomerID", "string");
            return sendErrorResponse(_errorMsg109, callback);
          }

          if (opts.CustomerID.length > 20) {
            var _errorMsg110 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "CustomerID", 20);
            return sendErrorResponse(_errorMsg110, callback);
          }
        }

        if (opts.hasOwnProperty("CustomerIdentifier")) {
          if (typeof opts.CustomerIdentifier !== "string") {
            var _errorMsg111 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "CustomerIdentifier", "string");
            return sendErrorResponse(_errorMsg111, callback);
          }

          if (opts.CustomerIdentifier.length !== 8) {
            var _errorMsg112 = genErrorMessage(ERROR_MESSAGE.fixedLengthLimitation, "CustomerIdentifier", 8);
            return sendErrorResponse(_errorMsg112, callback);
          }
        }

        if (opts.hasOwnProperty("Donation")) {
          if (typeof opts.Donation !== "string") {
            var _errorMsg113 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Donation", "string");
            return sendErrorResponse(_errorMsg113, callback);
          }
          if (opts.Donation.length > 1) {
            var _errorMsg114 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Donation", 1);
            return sendErrorResponse(_errorMsg114, callback);
          }
        }

        if (opts.hasOwnProperty("Print")) {
          if (typeof opts.Print !== "string") {
            var _errorMsg115 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Print", "string");
            return sendErrorResponse(_errorMsg115, callback);
          }
          if (opts.Print.length > 1) {
            var _errorMsg116 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Print", 1);
            return sendErrorResponse(_errorMsg116, callback);
          }
        }

        if (opts.Donation === "1" && opts.Print === "1") {
          var _errorMsg117 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Print", "0");
          return sendErrorResponse(_errorMsg117, callback);
        }
        if (opts.hasOwnProperty("CustomerIdentifier") && opts.CustomerIdentifier !== "") {
          if (!opts.hasOwnProperty("Print") || opts.Print === "0") {
            var _errorMsg118 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Print", "1");
            return sendErrorResponse(_errorMsg118, callback);
          }
        }

        if (opts.Print === "1") {
          if (!opts.hasOwnProperty("CustomerName") || !opts.CustomerName) {
            var _errorMsg119 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "CustomerName");
            return sendErrorResponse(_errorMsg119, callback);
          }
          if (!opts.hasOwnProperty("CustomerAddr") || !opts.CustomerAddr) {
            var _errorMsg120 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "CustomerAddr");
            return sendErrorResponse(_errorMsg120, callback);
          }
        }

        if (opts.hasOwnProperty("CustomerName")) {
          if (typeof opts.CustomerName !== "string") {
            var _errorMsg121 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "CustomerName", "string");
            return sendErrorResponse(_errorMsg121, callback);
          }
          if (opts.CustomerName.length > 20) {
            var _errorMsg122 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "CustomerName", 20);
            return sendErrorResponse(_errorMsg122, callback);
          }
        }

        if (opts.hasOwnProperty("CustomerAddr")) {
          if (typeof opts.CustomerAddr !== "string") {
            var _errorMsg123 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "CustomerAddr", "string");
            return sendErrorResponse(_errorMsg123, callback);
          }
          if (opts.CustomerAddr.length > 200) {
            var _errorMsg124 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "CustomerAddr", 200);
            return sendErrorResponse(_errorMsg124, callback);
          }
        }

        if (!opts.CustomerPhone && !opts.CustomerEmail) {
          var _errorMsg125 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "CustomerPhone or CustomerEmail");
          return sendErrorResponse(_errorMsg125, callback);
        }

        if (opts.hasOwnProperty("CustomerPhone")) {
          if (typeof opts.CustomerPhone !== "string") {
            var _errorMsg126 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "CustomerPhone", "string");
            return sendErrorResponse(_errorMsg126, callback);
          }
          if (opts.CustomerPhone.length > 20) {
            var _errorMsg127 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "CustomerPhone", 20);
            return sendErrorResponse(_errorMsg127, callback);
          }
        }

        if (opts.hasOwnProperty("CustomerEmail")) {
          if (typeof opts.CustomerEmail !== "string") {
            var _errorMsg128 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "CustomerEmail", "string");
            return sendErrorResponse(_errorMsg128, callback);
          }
          if (opts.CustomerEmail.length > 200) {
            var _errorMsg129 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "CustomerEmail", 200);
            return sendErrorResponse(_errorMsg129, callback);
          }
        }

        if (!opts.hasOwnProperty("TaxType")) {
          var _errorMsg130 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "TaxType");
          return sendErrorResponse(_errorMsg130, callback);
        }
        if (typeof opts.TaxType !== "string") {
          var _errorMsg131 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "TaxType", "string");
          return sendErrorResponse(_errorMsg131, callback);
        }
        if (opts.TaxType.length > 1) {
          var _errorMsg132 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "TaxType", 1);
          return sendErrorResponse(_errorMsg132, callback);
        }

        if (opts.hasOwnProperty("ClearanceMark")) {
          if (typeof opts.ClearanceMark !== "string") {
            var _errorMsg133 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ClearanceMark", "string");
            return sendErrorResponse(_errorMsg133, callback);
          }
          if (opts.ClearanceMark.length > 1) {
            var _errorMsg134 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "ClearanceMark", 1);
            return sendErrorResponse(_errorMsg134, callback);
          }
        }

        if (opts.TaxType === "2") {
          if (!opts.hasOwnProperty("ClearanceMark") || !opts.ClearanceMark) {
            var _errorMsg135 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "ClearanceMark");
            return sendErrorResponse(_errorMsg135, callback);
          }
        }

        if (opts.hasOwnProperty("CarruerNum")) {
          if (typeof opts.CarruerNum !== "string") {
            var _errorMsg136 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "CarruerNum", "string");
            return sendErrorResponse(_errorMsg136, callback);
          }
          if (opts.CarruerNum.length > 64) {
            var _errorMsg137 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "CarruerNum", 64);
            return sendErrorResponse(_errorMsg137, callback);
          }
        }

        switch (opts.CarruerType) {
          case undefined:
          case "":
          case "1":
            if (opts.hasOwnProperty("CarruerNum") && opts.CarruerNum !== "") {
              var _errorMsg139 = genErrorMessage(ERROR_MESSAGE.removeParameter, "CarruerNum");
              return sendErrorResponse(_errorMsg139, callback);
            }
            break;
          case "2":
            if (!opts.CarruerNum.match(/^[a-zA-Z]{2}\d{14}$/)) {
              var _errorMsg140 = genErrorMessage(ERROR_MESSAGE.wrongDataFormat, "CarruerNum");
              return sendErrorResponse(_errorMsg140, callback);
            }
            break;
          case "3":
            if (!opts.CarruerNum.match(/^\/{1}[0-9a-zA-Z+-.]{7}$/)) {
              var _errorMsg141 = genErrorMessage(ERROR_MESSAGE.wrongDataFormat, "CarruerNum");
              return sendErrorResponse(_errorMsg141, callback);
            }
            break;
          default:
            var _errorMsg138 = genErrorMessage(ERROR_MESSAGE.removeParameter, "CarruerNum");
            return sendErrorResponse(_errorMsg138, callback);
        }

        if (opts.CustomerIdentifier !== "" && opts.Donation === "1") {
          var _errorMsg142 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Donation", "2");
          return sendErrorResponse(_errorMsg142, callback);
        }

        if (opts.Donation === "1") {
          if (!opts.hasOwnProperty("LoveCode") || !opts.LoveCode) {
            var _errorMsg143 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "LoveCode");
            return sendErrorResponse(_errorMsg143, callback);
          }
          if (typeof opts.LoveCode !== "string") {
            var _errorMsg144 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "LoveCode", "string");
            return sendErrorResponse(_errorMsg144, callback);
          }
          if (!opts.LoveCode.match(/^([xX]{1}[0-9]{2,6}|[0-9]{3,7})$/)) {
            var _errorMsg145 = genErrorMessage(ERROR_MESSAGE.wrongDataFormat, "LoveCode");
            return sendErrorResponse(_errorMsg145, callback);
          }
        }

        if (!opts.hasOwnProperty("InvoiceItems")) {
          var _errorMsg146 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "InvoiceItems");
          return sendErrorResponse(_errorMsg146, callback);
        }
        if (!Array.isArray(opts.InvoiceItems)) {
          var _errorMsg147 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "InvoiceItems", "array");
          return sendErrorResponse(_errorMsg147, callback);
        }
        if (opts.InvoiceItems.length === 0) {
          var _errorMsg148 = genErrorMessage(ERROR_MESSAGE.cannotBeEmpty, "InvoiceItems");
          return sendErrorResponse(_errorMsg148, callback);
        }
        opts.InvoiceItems.forEach(function (invoiceItem) {
          if (!invoiceItem.hasOwnProperty("name")) {
            var _errorMsg149 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "InvoiceItems.name");
            return sendErrorResponse(_errorMsg149, callback);
          }
          if (typeof invoiceItem.name !== "string") {
            var _errorMsg150 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "InvoiceItems.name", "string");
            return sendErrorResponse(_errorMsg150, callback);
          }

          if (!invoiceItem.hasOwnProperty("count")) {
            var _errorMsg151 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "InvoiceItems.count");
            return sendErrorResponse(_errorMsg151, callback);
          }
          if (!Number.isInteger(invoiceItem.count)) {
            var _errorMsg152 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "InvoiceItems.count", "number");
            return sendErrorResponse(_errorMsg152, callback);
          }

          if (!invoiceItem.hasOwnProperty("word")) {
            var _errorMsg153 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "InvoiceItems.word");
            return sendErrorResponse(_errorMsg153, callback);
          }
          if (typeof invoiceItem.word !== "string") {
            var _errorMsg154 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "InvoiceItems.word", "string");
            return sendErrorResponse(_errorMsg154, callback);
          }

          if (!invoiceItem.hasOwnProperty("price")) {
            var _errorMsg155 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "InvoiceItems.price");
            return sendErrorResponse(_errorMsg155, callback);
          }
          if (!Number.isInteger(invoiceItem.price)) {
            var _errorMsg156 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "InvoiceItems.price", "number");
            return sendErrorResponse(_errorMsg156, callback);
          }

          if (!invoiceItem.hasOwnProperty("taxType")) {
            var _errorMsg157 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "InvoiceItems.taxType");
            return sendErrorResponse(_errorMsg157, callback);
          }
          if (typeof invoiceItem.taxType !== "string") {
            var _errorMsg158 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "InvoiceItems.taxType", "string");
            return sendErrorResponse(_errorMsg158, callback);
          }
        });

        if (opts.hasOwnProperty("DelayDay")) {
          if (!Number.isInteger(opts.DelayDay)) {
            var _errorMsg159 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "DelayDay", "number");
            return sendErrorResponse(_errorMsg159, callback);
          }
          if (opts.DelayDay < 0 || opts.DelayDay > 15) {
            var _errorMsg160 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "DelayDay", "0 ~ 15");
            return sendErrorResponse(_errorMsg160, callback);
          }
        }

        if (!opts.hasOwnProperty("InvType")) {
          var _errorMsg161 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "InvType");
          return sendErrorResponse(_errorMsg161, callback);
        }
        if (typeof opts.InvType !== "string") {
          var _errorMsg162 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "InvType", "string");
          return sendErrorResponse(_errorMsg162, callback);
        }
        if (opts.InvType.length > 2) {
          var _errorMsg163 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "InvType", 2);
          return sendErrorResponse(_errorMsg163, callback);
        }
      }

      // 廠商編號
      data.MerchantID = CONFIG.merchantID;

      // 廠商交易編號
      data.MerchantTradeNo = opts.MerchantTradeNo;

      // 廠商交易時間
      data.MerchantTradeDate = opts.MerchantTradeDate;

      // 交易類型
      data.PaymentType = "aio";

      // 交易金額
      data.TotalAmount = opts.TotalAmount;

      // 交易描述
      data.TradeDesc = opts.TradeDesc;

      // 商品名稱
      var items = [];
      var alipayItemNames = [];
      var alipayItemCounts = [];
      var alipayItemPrices = [];
      opts.Items.forEach(function (item) {
        items.push(item.name + " " + item.price + " " + item.currency + " x " + item.quantity);

        if (opts.ChoosePayment === "Alipay") {
          alipayItemNames.push(item.name);
          alipayItemCounts.push(item.quantity);
          alipayItemPrices.push(item.price);
        }
      });
      data.ItemName = items.join("#").substr(0, 200);

      // 付款完成通知回傳網址
      data.ReturnURL = opts.ReturnURL;

      // 選擇預設付款方式
      data.ChoosePayment = opts.ChoosePayment;

      // Client 端返回廠商網址
      if (opts.hasOwnProperty("ClientBackURL")) {
        data.ClientBackURL = opts.ClientBackURL;
      }

      // 商品銷售網址
      if (opts.hasOwnProperty("ItemURL")) {
        data.ItemURL = opts.ItemURL;
      }

      // 備註欄位
      if (opts.hasOwnProperty("Remark")) {
        data.Remark = opts.Remark;
      }

      // 選擇預設付款子項目
      if (opts.hasOwnProperty("ChooseSubPayment")) {
        data.ChooseSubPayment = opts.ChooseSubPayment;
      }

      // Client 端回傳付款結果網址
      if (opts.hasOwnProperty("OrderResultURL")) {
        data.OrderResultURL = opts.OrderResultURL;
      }

      // 是否需要額外的付款資訊
      if (opts.hasOwnProperty("NeedExtraPaidInfo")) {
        data.NeedExtraPaidInfo = opts.NeedExtraPaidInfo;
      }

      // 裝置來源
      if (opts.hasOwnProperty("DeviceSource")) {
        data.DeviceSource = opts.DeviceSource;
      }

      // 隱藏付款方式
      if (data.ChoosePayment === "ALL" && opts.hasOwnProperty("IgnorePayment")) {
        data.IgnorePayment = opts.IgnorePayment;
      }

      // 特約合作平台商代號
      if (opts.hasOwnProperty("PlatformID")) {
        data.PlatformID = opts.PlatformID;
      }

      // 電子發票開註記
      if (opts.hasOwnProperty("InvoiceMark")) {
        data.InvoiceMark = opts.InvoiceMark;
      }

      // 是否延遲撥款
      if (opts.hasOwnProperty("HoldTradeAMT")) {
        data.HoldTradeAMT = opts.HoldTradeAMT;
      }

      // CheckMacValue 加密類型
      if (opts.hasOwnProperty("EncryptType")) {
        data.EncryptType = opts.EncryptType;
      }

      // 是否可以使用購物金/紅包折抵
      if (opts.hasOwnProperty("UseRedeem")) {
        data.UseRedeem = opts.UseRedeem;
      }

      if (data.ChoosePayment === "ATM") {
        // 允許繳費有效天數
        if (opts.hasOwnProperty("ExpireDate")) {
          data.ExpireDate = opts.ExpireDate;
        }

        // Server 端回傳付款相關資訊
        if (opts.hasOwnProperty("PaymentInfoURL")) {
          data.PaymentInfoURL = opts.PaymentInfoURL;
        }

        // Client 端回傳付款相關資訊
        if (opts.hasOwnProperty("ClientRedirectURL")) {
          data.ClientRedirectURL = opts.ClientRedirectURL;
        }
      }

      if (["CVS", "BARCODE"].indexOf(data.ChoosePayment) > -1) {
        // 超商繳費截止時間
        if (opts.hasOwnProperty("StoreExpireDate")) {
          data.StoreExpireDate = opts.StoreExpireDate;
        }

        // 交易描述 1
        if (opts.hasOwnProperty("Desc_1")) {
          data.Desc_1 = opts.Desc_1;
        }

        // 交易描述 2
        if (opts.hasOwnProperty("Desc_2")) {
          data.Desc_2 = opts.Desc_2;
        }

        // 交易描述 3
        if (opts.hasOwnProperty("Desc_3")) {
          data.Desc_3 = opts.Desc_3;
        }

        // 交易描述 4
        if (opts.hasOwnProperty("Desc_4")) {
          data.Desc_4 = opts.Desc_4;
        }

        // Server 端回傳付款相關資訊
        if (opts.hasOwnProperty("PaymentInfoURL")) {
          data.PaymentInfoURL = opts.PaymentInfoURL;
        }

        // Client 端回傳付款相關資訊
        if (opts.hasOwnProperty("ClientRedirectURL")) {
          data.ClientRedirectURL = opts.ClientRedirectURL;
        }
      }

      if (data.ChoosePayment === "Alipay") {
        // 商品名稱
        data.AlipayItemName = alipayItemNames.join("#").substr(0, 200);

        // 商品購買數量
        data.AlipayItemCounts = alipayItemCounts.join("#").substr(0, 100);

        // 商品單價
        data.AlipayItemPrice = alipayItemPrices.join("#").substr(0, 20);

        // 購買人信箱
        data.Email = opts.Email;

        // 購買人電話
        data.PhoneNo = opts.PhoneNo;

        // 購買人姓名
        data.UserName = opts.UserName;
      }

      if (data.ChoosePayment === "Tenpay") {
        // 付款截止時間
        if (opts.hasOwnProperty("ExpireTime")) {
          data.ExpireTime = opts.ExpireTime;
        }
      }

      if (data.ChoosePayment === "Credit") {
        // 刷卡分期期數
        if (opts.hasOwnProperty("CreditInstallment")) {
          data.CreditInstallment = opts.CreditInstallment;
        }

        // 使用刷卡分期的付款金額
        if (opts.hasOwnProperty("InstallmentAmount")) {
          data.InstallmentAmount = opts.InstallmentAmount;
        }

        // 信用卡是否使用紅利折抵
        if (opts.hasOwnProperty("Redeem")) {
          data.Redeem = opts.Redeem;
        }

        // 是否為銀聯卡交易
        if (opts.hasOwnProperty("UnionPay")) {
          data.UnionPay = opts.UnionPay;
        }

        // 語系設定
        if (opts.hasOwnProperty("Language")) {
          data.Language = opts.Language;
        }

        // 每次授權金額
        if (opts.hasOwnProperty("PeriodAmount")) {
          data.PeriodAmount = opts.PeriodAmount;
        }

        // 週期種類
        if (opts.hasOwnProperty("PeriodType")) {
          data.PeriodType = opts.PeriodType;
        }

        // 執行頻率
        if (opts.hasOwnProperty("Frequency")) {
          data.Frequency = opts.Frequency;
        }

        // 執行次數
        if (opts.hasOwnProperty("ExecTimes")) {
          data.ExecTimes = opts.ExecTimes;
        }

        // 定期定額的執行結果回應 URL語系設定
        if (opts.hasOwnProperty("PeriodReturnURL")) {
          data.PeriodReturnURL = opts.PeriodReturnURL;
        }
      }

      if (data.InvoiceMark === "Y") {
        // 廠商自訂編號
        data.RelateNumber = opts.RelateNumber;

        // 客戶代號
        data.CustomerID = opts.CustomerID || "";

        // 統一編號
        data.CustomerIdentifier = opts.CustomerIdentifier || "";

        // 客戶名稱
        data.CustomerName = urlEncode(opts.CustomerName || "");

        // 客戶地址
        data.CustomerAddr = urlEncode(opts.CustomerAddr || "");

        // 客戶手機號碼
        data.CustomerPhone = opts.CustomerPhone || "";

        // 客戶電子信箱
        data.CustomerEmail = urlEncode(opts.CustomerEmail || "");

        // 通關方式
        data.ClearanceMark = opts.ClearanceMark || "";

        // 課稅類別
        data.TaxType = opts.TaxType;

        // 載具類別
        data.CarruerType = opts.CarruerType || "";

        // 載具編號
        data.CarruerNum = opts.CarruerNum || "";

        // 捐贈註記
        data.Donation = opts.Donation || "2";

        // 愛心碼
        data.LoveCode = opts.LoveCode || "";

        // 列印註記
        data.Print = opts.Print || "0";

        var itemNames = [];
        var itemCounts = [];
        var itemWords = [];
        var itemPrices = [];
        var itemTaxTypes = [];
        opts.InvoiceItems.forEach(function (item) {
          itemNames.push(urlEncode(item.name));
          itemCounts.push(item.count);
          itemWords.push(urlEncode(item.word));
          itemPrices.push(item.price);
          itemTaxTypes.push(item.taxType);
        });

        // 商品名稱
        data.InvoiceItemName = itemNames.join("|");

        // 商品數量
        data.InvoiceItemCount = itemCounts.join("|");

        // 商品單位
        data.InvoiceItemWord = itemWords.join("|");

        // 商品價格
        data.InvoiceItemPrice = itemPrices.join("|");

        // 商品課稅別
        data.InvoiceItemTaxType = itemTaxTypes.join("|");

        // 備註
        data.InvoiceRemark = urlEncode(opts.InvoiceRemark || "");

        // 延遲天數
        data.DelayDay = opts.DelayDay || 0;

        // 字軌類別
        data.InvType = opts.InvType;
      }

      /* Always include PaymentInfoURL regardless of ChoosePayment */
      data.PaymentInfoURL = opts.PaymentInfoURL;

      // 檢查碼
      data.CheckMacValue = opts.hasOwnProperty("CheckMacValue") ? opts.CheckMacValue : this.genCheckMacValue(data, data.EncryptType === 1 ? "sha256" : "md5");

      // 產生表單資料
      var url = (CONFIG.useSSL ? "https" : "http") + "://" + CONFIG.host + ENDPOINT.aioCheckOut;
      var target = opts.target || "_self";
      var html = "<form id=\"_allpayForm\" method=\"post\" target=\"" + target + "\" action=\"" + url + "\">";
      Object.keys(data).forEach(function (key) {
        html += "<input type=\"hidden\" name=\"" + key + "\" value=\"" + data[key] + "\" />";
      });
      if (opts.hasOwnProperty("paymentButton") && opts.paymentButton !== "") {
        html += "<input type=\"submit\" id=\"_paymentButton\" value=\"" + opts.paymentButton + "\" />";
      } else {
        html += '<script type="text/javascript">document.getElementById("_allpayForm").submit();</script>';
      }
      html += "</form>";

      if (callback) {
        callback(undefined, {
          url: url,
          data: data,
          html: html
        });
      }
    }

    /**
     * 訂單查詢
     *
     * @param {object} opts - 訂單查詢相關參數，請參考「全方位金流API介接技術文件」
     * @param {requestCallback} callback - 處理回應的 callback
     */

  }, {
    key: "queryTradeInfo",
    value: function queryTradeInfo(opts) {
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      var data = {};

      // 參數檢查
      if ((typeof opts === "undefined" ? "undefined" : _typeof(opts)) !== "object") {
        return sendErrorResponse(new Error(ERROR_MESSAGE.wrongParameter), callback);
      }

      if (!opts.hasOwnProperty("MerchantTradeNo")) {
        var errorMsg = genErrorMessage(ERROR_MESSAGE.requiredParameter, "MerchantTradeNo");
        return sendErrorResponse(errorMsg, callback);
      }
      if (typeof opts.MerchantTradeNo !== "string") {
        var _errorMsg164 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "MerchantTradeNo", "string");
        return sendErrorResponse(_errorMsg164, callback);
      }
      if (opts.MerchantTradeNo.length > 20) {
        var _errorMsg165 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "MerchantTradeNo", 20);
        return sendErrorResponse(_errorMsg165, callback);
      }

      if (opts.hasOwnProperty("PlatformID") && opts.PlatformID.length > 10) {
        var _errorMsg166 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "PlatformID", 10);
        return sendErrorResponse(_errorMsg166, callback);
      }

      // 廠商編號
      data.MerchantID = CONFIG.merchantID;

      // 廠商交易編號
      data.MerchantTradeNo = opts.MerchantTradeNo;

      // 驗證時間
      data.TimeStamp = Date.now();

      // 特約合作平台商代號
      if (opts.hasOwnProperty("PlatformID")) {
        data.PlatformID = opts.PlatformID;
      }

      // 檢查碼
      data.CheckMacValue = opts.hasOwnProperty("CheckMacValue") ? opts.CheckMacValue : this.genCheckMacValue(data);

      sendRequest("POST", ENDPOINT.queryTradeInfo, data, callback);
    }
  }, {
    key: "queryTradeOfCreditCard",
    value: function queryTradeOfCreditCard(opts) {
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      var data = _extends({}, opts, {
        MerchantID: CONFIG.merchantID
      });

      sendRequest("POST", '/CreditDetail/QueryTrade/V2', _extends({}, data, {
        CheckMacValue: this.genCheckMacValue(data)
      }), callback);
    }

    /**
     * 信用卡定期定額訂單查詢
     *
     * @param {object} opts - 信用卡定期定額訂單查詢相關參數，請參考「全方位金流API介接技術文件」
     * @param {requestCallback} callback - 處理回應的 callback
     */

  }, {
    key: "queryCreditCardPeriodInfo",
    value: function queryCreditCardPeriodInfo(opts) {
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      var data = {};

      // 參數檢查
      if ((typeof opts === "undefined" ? "undefined" : _typeof(opts)) !== "object") {
        return sendErrorResponse(new Error(ERROR_MESSAGE.wrongParameter), callback);
      }

      if (!opts.hasOwnProperty("MerchantTradeNo")) {
        var errorMsg = genErrorMessage(ERROR_MESSAGE.requiredParameter, "MerchantTradeNo");
        return sendErrorResponse(errorMsg, callback);
      }
      if (typeof opts.MerchantTradeNo !== "string") {
        var _errorMsg167 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "MerchantTradeNo", "string");
        return sendErrorResponse(_errorMsg167, callback);
      }
      if (opts.MerchantTradeNo.length > 20) {
        var _errorMsg168 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "MerchantTradeNo", 20);
        return sendErrorResponse(_errorMsg168, callback);
      }

      // 廠商編號
      data.MerchantID = CONFIG.merchantID;

      // 廠商交易編號
      data.MerchantTradeNo = opts.MerchantTradeNo;

      // 驗證時間
      data.TimeStamp = Date.now();

      // 檢查碼
      data.CheckMacValue = opts.hasOwnProperty("CheckMacValue") ? opts.CheckMacValue : this.genCheckMacValue(data);

      sendRequest("POST", ENDPOINT.queryCreditCardPeriodInfo, data, callback);
    }

    /**
     * 信用卡關帳/退刷/取消/放棄
     *
     * @param {object} opts - 信用卡關帳/退刷/取消/放棄相關參數，請參考「全方位金流API介接技術文件」
     * @param {requestCallback} callback - 處理回應的 callback
     */

  }, {
    key: "doAction",
    value: function doAction(opts) {
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      if (CONFIG.mode === "test") {
        return sendErrorResponse(new Error(ERROR_MESSAGE.notSupported), callback);
      }

      var data = {};

      // 參數檢查
      if ((typeof opts === "undefined" ? "undefined" : _typeof(opts)) !== "object") {
        return sendErrorResponse(new Error(ERROR_MESSAGE.wrongParameter), callback);
      }

      if (!opts.hasOwnProperty("MerchantTradeNo")) {
        var errorMsg = genErrorMessage(ERROR_MESSAGE.requiredParameter, "MerchantTradeNo");
        return sendErrorResponse(errorMsg, callback);
      }
      if (typeof opts.MerchantTradeNo !== "string") {
        var _errorMsg169 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "MerchantTradeNo", "string");
        return sendErrorResponse(_errorMsg169, callback);
      }
      if (opts.MerchantTradeNo.length > 20) {
        var _errorMsg170 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "MerchantTradeNo", 20);
        return sendErrorResponse(_errorMsg170, callback);
      }

      if (!opts.hasOwnProperty("TradeNo")) {
        var _errorMsg171 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "TradeNo");
        return sendErrorResponse(_errorMsg171, callback);
      }
      if (typeof opts.TradeNo !== "string") {
        var _errorMsg172 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "TradeNo", "string");
        return sendErrorResponse(_errorMsg172, callback);
      }
      if (opts.TradeNo.length > 20) {
        var _errorMsg173 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "TradeNo", 20);
        return sendErrorResponse(_errorMsg173, callback);
      }

      if (!opts.hasOwnProperty("Action")) {
        var _errorMsg174 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "Action");
        return sendErrorResponse(_errorMsg174, callback);
      }
      if (typeof opts.Action !== "string") {
        var _errorMsg175 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Action", "string");
        return sendErrorResponse(_errorMsg175, callback);
      }
      if (opts.Action.length > 1) {
        var _errorMsg176 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Action", 1);
        return sendErrorResponse(_errorMsg176, callback);
      }

      if (!opts.hasOwnProperty("TotalAmount")) {
        var _errorMsg177 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "TotalAmount");
        return sendErrorResponse(_errorMsg177, callback);
      }
      if (!Number.isInteger(opts.TotalAmount)) {
        var _errorMsg178 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "TotalAmount", "number");
        return sendErrorResponse(_errorMsg178, callback);
      }

      if (opts.hasOwnProperty("PlatformID")) {
        if (typeof opts.PlatformID !== "string") {
          var _errorMsg179 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "PlatformID", "string");
          return sendErrorResponse(_errorMsg179, callback);
        }

        if (opts.PlatformID.length > 10) {
          var _errorMsg180 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "PlatformID", 10);
          return sendErrorResponse(_errorMsg180, callback);
        }
      }

      // 廠商編號
      data.MerchantID = CONFIG.merchantID;

      // 廠商交易編號
      data.MerchantTradeNo = opts.MerchantTradeNo;

      // AllPay 的交易編號
      data.TradeNo = opts.TradeNo;

      // 執行動作
      data.Action = opts.Action;

      // 金額
      data.TotalAmount = opts.TotalAmount;

      // 特約合作平台商代號
      if (opts.hasOwnProperty("PlatformID")) {
        data.PlatformID = opts.PlatformID;
      }

      // 檢查碼
      data.CheckMacValue = opts.hasOwnProperty("CheckMacValue") ? opts.CheckMacValue : this.genCheckMacValue(data);

      sendRequest("POST", ENDPOINT.doAction, data, callback);
    }

    /**
     * 廠商通知退款
     *
     * @param {object} opts - 廠商通知退款相關參數，請參考「全方位金流API介接技術文件」
     * @param {requestCallback} callback - 處理回應的 callback
     */

  }, {
    key: "aioChargeback",
    value: function aioChargeback(opts) {
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      var data = {};

      // 參數檢查
      if ((typeof opts === "undefined" ? "undefined" : _typeof(opts)) !== "object") {
        return sendErrorResponse(new Error(ERROR_MESSAGE.wrongParameter), callback);
      }

      if (!opts.hasOwnProperty("MerchantTradeNo")) {
        var errorMsg = genErrorMessage(ERROR_MESSAGE.requiredParameter, "MerchantTradeNo");
        return sendErrorResponse(errorMsg, callback);
      }
      if (typeof opts.MerchantTradeNo !== "string") {
        var _errorMsg181 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "MerchantTradeNo", "string");
        return sendErrorResponse(_errorMsg181, callback);
      }
      if (opts.MerchantTradeNo.length > 20) {
        var _errorMsg182 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "MerchantTradeNo", 20);
        return sendErrorResponse(_errorMsg182, callback);
      }

      if (!opts.hasOwnProperty("TradeNo")) {
        var _errorMsg183 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "TradeNo");
        return sendErrorResponse(_errorMsg183, callback);
      }
      if (typeof opts.TradeNo !== "string") {
        var _errorMsg184 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "TradeNo", "string");
        return sendErrorResponse(_errorMsg184, callback);
      }
      if (opts.TradeNo.length > 20) {
        var _errorMsg185 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "TradeNo", 20);
        return sendErrorResponse(_errorMsg185, callback);
      }

      if (!opts.hasOwnProperty("ChargeBackTotalAmount")) {
        var _errorMsg186 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "ChargeBackTotalAmount");
        return sendErrorResponse(_errorMsg186, callback);
      }
      if (!Number.isInteger(opts.ChargeBackTotalAmount)) {
        var _errorMsg187 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "ChargeBackTotalAmount", "number");
        return sendErrorResponse(_errorMsg187, callback);
      }

      if (opts.hasOwnProperty("Remark")) {
        if (typeof opts.Remark !== "string") {
          var _errorMsg188 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Remark", "string");
          return sendErrorResponse(_errorMsg188, callback);
        }

        if (opts.Remark.length > 100) {
          var _errorMsg189 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Remark", 100);
          return sendErrorResponse(_errorMsg189, callback);
        }
      }

      if (opts.hasOwnProperty("PlatformID")) {
        if (typeof opts.PlatformID !== "string") {
          var _errorMsg190 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "PlatformID", "string");
          return sendErrorResponse(_errorMsg190, callback);
        }

        if (opts.PlatformID.length > 10) {
          var _errorMsg191 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "PlatformID", 10);
          return sendErrorResponse(_errorMsg191, callback);
        }
      }

      // 廠商編號
      data.MerchantID = CONFIG.merchantID;

      // 廠商交易編號
      data.MerchantTradeNo = opts.MerchantTradeNo;

      // AllPay 的交易編號
      data.TradeNo = opts.TradeNo;

      // 退款金額
      data.ChargeBackTotalAmount = opts.ChargeBackTotalAmount;

      // 備註欄位
      if (opts.hasOwnProperty("Remark")) {
        data.Remark = opts.Remark;
      }

      // 特約合作平台商代號
      if (opts.hasOwnProperty("PlatformID")) {
        data.PlatformID = opts.PlatformID;
      }

      // 檢查碼
      data.CheckMacValue = opts.hasOwnProperty("CheckMacValue") ? opts.CheckMacValue : this.genCheckMacValue(data);

      sendRequest("POST", ENDPOINT.aioChargeback, data, callback);
    }

    /**
     * 廠商申請撥款/退款
     *
     * @param {object} opts - 廠商申請撥款/退款相關參數，請參考「全方位金流API介接技術文件」
     * @param {requestCallback} callback - 處理回應的 callback
     */

  }, {
    key: "capture",
    value: function capture(opts) {
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      var data = {};

      // 參數檢查
      if ((typeof opts === "undefined" ? "undefined" : _typeof(opts)) !== "object") {
        return sendErrorResponse(new Error(ERROR_MESSAGE.wrongParameter), callback);
      }

      if (!opts.hasOwnProperty("MerchantTradeNo")) {
        var errorMsg = genErrorMessage(ERROR_MESSAGE.requiredParameter, "MerchantTradeNo");
        return sendErrorResponse(errorMsg, callback);
      }
      if (typeof opts.MerchantTradeNo !== "string") {
        var _errorMsg192 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "MerchantTradeNo", "string");
        return sendErrorResponse(_errorMsg192, callback);
      }
      if (opts.MerchantTradeNo.length > 20) {
        var _errorMsg193 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "MerchantTradeNo", 20);
        return sendErrorResponse(_errorMsg193, callback);
      }

      if (!opts.hasOwnProperty("CaptureAMT")) {
        var _errorMsg194 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "CaptureAMT");
        return sendErrorResponse(_errorMsg194, callback);
      }
      if (!Number.isInteger(opts.CaptureAMT)) {
        var _errorMsg195 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "CaptureAMT", "number");
        return sendErrorResponse(_errorMsg195, callback);
      }

      if (!opts.hasOwnProperty("UserRefundAMT")) {
        var _errorMsg196 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "UserRefundAMT");
        return sendErrorResponse(_errorMsg196, callback);
      }
      if (!Number.isInteger(opts.UserRefundAMT)) {
        var _errorMsg197 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "UserRefundAMT", "number");
        return sendErrorResponse(_errorMsg197, callback);
      }

      if (opts.UserRefundAMT !== 0) {
        if (!opts.hasOwnProperty("UserName")) {
          var _errorMsg198 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "UserName");
          return sendErrorResponse(_errorMsg198, callback);
        }

        if (!opts.hasOwnProperty("UserCellPhone")) {
          var _errorMsg199 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "UserCellPhone");
          return sendErrorResponse(_errorMsg199, callback);
        }
      }

      if (opts.hasOwnProperty("UserName")) {
        if (typeof opts.UserName !== "string") {
          var _errorMsg200 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "UserName", "string");
          return sendErrorResponse(_errorMsg200, callback);
        }

        if (opts.UserName.length > 20) {
          var _errorMsg201 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "UserName", 20);
          return sendErrorResponse(_errorMsg201, callback);
        }
      }

      if (opts.hasOwnProperty("UserCellPhone")) {
        if (typeof opts.UserCellPhone !== "string") {
          var _errorMsg202 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "UserCellPhone", "string");
          return sendErrorResponse(_errorMsg202, callback);
        }

        if (opts.UserCellPhone.length > 20) {
          var _errorMsg203 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "UserCellPhone", 20);
          return sendErrorResponse(_errorMsg203, callback);
        }
      }

      if (opts.hasOwnProperty("PlatformID")) {
        if (typeof opts.PlatformID !== "string") {
          var _errorMsg204 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "PlatformID", "string");
          return sendErrorResponse(_errorMsg204, callback);
        }

        if (opts.PlatformID.length > 10) {
          var _errorMsg205 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "PlatformID", 10);
          return sendErrorResponse(_errorMsg205, callback);
        }
      }

      if (opts.hasOwnProperty("UpdatePlatformChargeFee")) {
        if (typeof opts.UpdatePlatformChargeFee !== "string") {
          var _errorMsg206 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "UpdatePlatformChargeFee", "string");
          return sendErrorResponse(_errorMsg206, callback);
        }

        if (opts.UpdatePlatformChargeFee.length > 1) {
          var _errorMsg207 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "UpdatePlatformChargeFee", 1);
          return sendErrorResponse(_errorMsg207, callback);
        }
      }

      if (opts.UpdatePlatformChargeFee === "Y") {
        if (!opts.hasOwnProperty("PlatformChargeFee")) {
          var _errorMsg208 = genErrorMessage(ERROR_MESSAGE.requiredParameter, "PlatformChargeFee");
          return sendErrorResponse(_errorMsg208, callback);
        }

        if (!Number.isInteger(opts.PlatformChargeFee)) {
          var _errorMsg209 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "PlatformChargeFee", "number");
          return sendErrorResponse(_errorMsg209, callback);
        }
      }

      if (opts.hasOwnProperty("Remark")) {
        if (typeof opts.Remark !== "string") {
          var _errorMsg210 = genErrorMessage(ERROR_MESSAGE.invalidParameter, "Remark", "string");
          return sendErrorResponse(_errorMsg210, callback);
        }

        if (opts.Remark.length > 30) {
          var _errorMsg211 = genErrorMessage(ERROR_MESSAGE.lengthLimitation, "Remark", 30);
          return sendErrorResponse(_errorMsg211, callback);
        }
      }

      // 廠商編號
      data.MerchantID = CONFIG.merchantID;

      // 廠商交易編號
      data.MerchantTradeNo = opts.MerchantTradeNo;

      // 廠商申請撥款金額
      data.CaptureAMT = opts.CaptureAMT;

      // 要退款給買方的金額
      data.UserRefundAMT = opts.UserRefundAMT;

      if (data.UserRefundAMT !== 0) {
        // 購買人姓名
        data.UserName = opts.UserName;

        // 買方手機號碼
        data.UserCellPhone = opts.UserCellPhone;
      }

      // 特約合作平台商代號
      if (opts.hasOwnProperty("PlatformID")) {
        data.PlatformID = opts.PlatformID;
      }

      // 是否更改特約合作平台商手續費
      if (opts.hasOwnProperty("UpdatePlatformChargeFee")) {
        data.UpdatePlatformChargeFee = opts.UpdatePlatformChargeFee;

        if (data.UpdatePlatformChargeFee === "Y") {
          // 特約合作平台商手續費
          data.PlatformChargeFee = opts.PlatformChargeFee;
        }
      }

      // 備註
      if (opts.hasOwnProperty("Remark")) {
        data.Remark = opts.Remark;
      }

      // 檢查碼
      data.CheckMacValue = opts.hasOwnProperty("CheckMacValue") ? opts.CheckMacValue : this.genCheckMacValue(data);

      sendRequest("POST", ENDPOINT.capture, data, callback);
    }

    /**
     * 產生交易檢查碼
     *
     * @param {Object} data - 交易資料
     * @param {string} encryptType - 加密類型
     */

  }, {
    key: "genCheckMacValue",
    value: function genCheckMacValue(data) {
      var encryptType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "md5";

      if (["md5", "sha256"].indexOf(encryptType.toLowerCase()) === -1) {
        var errorMsg = genErrorMessage(ERROR_MESSAGE.invalidParameter, "encryptType", "'md5' or 'sha256'");
        return sendErrorResponse(errorMsg);
      }

      // 若有 CheckMacValue 則先移除
      if (data.hasOwnProperty("CheckMacValue")) {
        delete data.CheckMacValue;
      }

      var hashKey = data.hashKey || CONFIG.hashKey;
      var hashIV = data.hashIV || CONFIG.hashIV;

      if (data.hasOwnProperty("hashKey")) {
        delete data.hashKey;
      }

      if (data.hasOwnProperty("hashIV")) {
        delete data.hashIV;
      }

      // 使用物件 key 排序資料
      var keys = Object.keys(data).sort(function (s1, s2) {
        var s1lower = s1.toLowerCase();
        var s2lower = s2.toLowerCase();

        return s1lower > s2lower ? 1 : s1lower < s2lower ? -1 : 0;
      });
      var uri = keys.map(function (key) {
        return key + "=" + data[key];
      }).join("&");

      uri = "HashKey=" + hashKey + "&" + uri + "&HashIV=" + hashIV;

      log("==================================================");
      log("The data below will be used to generate CheckMacValue");
      log("==================================================");
      log(uri);

      uri = urlEncode(uri);
      uri = uri.toLowerCase();

      var checksum = _crypto2.default.createHash(encryptType).update(uri).digest("hex").toUpperCase();

      log("==================================================");
      log("Generated CheckMacValue");
      log("==================================================");
      log(checksum);

      return checksum;
    }

    /**
     * 驗證資料正確性
     *
     * @param {Object} data - 待驗證資料
     * @param {string} encryptType - 加密類型
     */

  }, {
    key: "isDataValid",
    value: function isDataValid(data) {
      var encryptType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "md5";

      log("==================================================");
      log("Start to validate the following data");
      log("==================================================");
      log(data);

      var receivedCheckMacValue = data.CheckMacValue;
      var generatedCheckMacValue = this.genCheckMacValue(data, encryptType);
      var isMatched = receivedCheckMacValue === generatedCheckMacValue;

      log("Validation Result: " + (isMatched ? "Match" : "Not match"));

      return isMatched;
    }
  }]);

  return Allpay;
}();

/**
 * 將資料編碼成與 .Net UrlEncode 相符的格式
 *
 * @param {string} data - 待編碼資料
 * @private
 */


function urlEncode(data) {
  log("==================================================");
  log("Data before urlEncode");
  log("==================================================");
  log(data);

  if (data === "") {
    return data;
  }

  var find = ["~", "%20", "'"];
  var replace = ["%7E", "+", "%27"];
  var encodedData = encodeURIComponent(data);

  find.forEach(function (encodedChar, index) {
    var regex = new RegExp(encodedChar, "g");
    encodedData = encodedData.replace(regex, replace[index]);
  });

  log("==================================================");
  log("Data after urlEncode");
  log("==================================================");
  log(encodedData);

  return encodedData;
}

/**
 * 發送 HTTP/HTTPS 請求
 *
 * @param {string} method - HTTP 方法
 * @param {string} path - 請求路徑
 * @param {object} data - 資料
 * @param {requestCallback} callback - 處理回應的 callback
 * @private
 */
function sendRequest(method, path, data, callback) {
  if (!CONFIG.isInitialized) {
    throw ERROR_MESSAGE.initializeRequired;
  }

  log("==================================================");
  log("The data below will be sent");
  log("==================================================");
  log(data);

  var dataString = _querystring2.default.stringify(data);

  var headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  // 使用 POST 時設定 Content-Length 標頭
  if (method === "POST") {
    headers["Content-Length"] = dataString.length;
  } else {
    path = path + "?" + dataString;
  }

  var options = {
    host: CONFIG.host,
    port: CONFIG.port,
    path: path,
    method: method,
    headers: headers
  };

  var request = void 0;
  if (!CONFIG.useSSL) {
    request = _http2.default.request(options);
  } else {
    request = _https2.default.request(options);
  }

  log("==================================================");
  log("HTTP/HTTPS request options");
  log("==================================================");
  log(options);

  if (method === "POST") {
    log("==================================================");
    log("Send request");
    log("==================================================");
    log(dataString);
    request.write(dataString);
  }

  request.end();

  var buffer = "";
  request.on("response", function (response) {
    response.setEncoding("utf8");

    response.on("data", function (chunk) {
      buffer += chunk;
    });

    response.on("end", function () {
      var responseData = void 0;

      log("==================================================");
      log("Response data");
      log("==================================================");
      log(buffer);

      if (callback) {
        var err = undefined;

        // 另外處理非 JSON 物件的返回值
        if (NON_JSON_RESPONSE_ENDPOINT.indexOf(path) > -1) {
          if (response.statusCode === 200) {
            if (path === ENDPOINT.aioChargeback) {
              var _buffer$split = buffer.split("|"),
                  _buffer$split2 = _slicedToArray(_buffer$split, 2),
                  status = _buffer$split2[0],
                  message = _buffer$split2[1];

              responseData = {
                status: status,
                message: message
              };
            } else {
              responseData = {};
              var responseArr = buffer.split("&");
              responseArr.forEach(function (param) {
                var _param$split = param.split("="),
                    _param$split2 = _slicedToArray(_param$split, 2),
                    key = _param$split2[0],
                    value = _param$split2[1];

                responseData[key] = value;
              });
            }
          } else {
            err = response.statusCode;
          }
        } else {
          try {
            responseData = JSON.parse(buffer);
          } catch (error) {
            log("==================================================");
            log("Could not convert API response to JSON, the error below is ignored and raw API response is returned to client");
            log("==================================================");
            log(error);
            err = error;
          }
        }

        callback(err, responseData);
      }
    });

    response.on("close", function (err) {
      log("==================================================");
      log("Problem with API request detailed stacktrace below");
      log("==================================================");
      log(err);
      sendErrorResponse(err, callback);
    });
  });

  request.on("error", function (err) {
    log("==================================================");
    log("Problem with API request detailed stacktrace below");
    log("==================================================");
    log(err);
    sendErrorResponse(err, callback);
  });
}

/**
 * 返回或拋出錯誤回應
 *
 * @param {requestCallback} callback - 處理回應的 callback
 * @param {Object} err - 錯誤物件
 * @param {Object} returnData - 回應資料
 * @private
 */
function sendErrorResponse(err) {
  var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
  var returnData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

  var error = void 0;
  if (err instanceof Error) {
    error = err;
  } else {
    error = new Error(err);
  }

  if (callback) {
    callback(error, returnData);
  } else {
    throw error;
  }
}

/**
 * 訊息紀錄
 *
 * @param {Object} message - 訊息物件
 * @private
 */
function log(message) {
  if (message instanceof Error) {
    console.log(message.stack);
  }

  if (CONFIG.debug) {
    if ((typeof message === "undefined" ? "undefined" : _typeof(message)) === "object") {
      console.log(JSON.stringify(message, null, 2));
    } else {
      console.log(message);
    }
  }
}

/**
 * 格式化錯誤訊息
 *
 * @param {string} template - 格式化字串
 * @param {string[]} values - 欲帶入格式化字串的資料
 * @private
 */
function genErrorMessage(template) {
  for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    values[_key - 1] = arguments[_key];
  }

  return _util2.default.format.apply(_util2.default, [template].concat(values));
}

module.exports = Allpay;