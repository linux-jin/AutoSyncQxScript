// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: phone-square;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: phone-square;
/*
 * @author: 2Ya&脑瓜 (原UI作者)
 * @integration: (RSA登录 + 电信官方API)
 * @feedback https://t.me/Scriptable_CN
 * version: 3.0.0-rsa
 * update: 2026-08-02
 * 说明：使用 Scripting 版本的登录逻辑（RSA加密+电信官方API，支持多账户）
 * 
 * 📱 Device ID 参数说明：
 * Device ID 用于解决部分用户登录失败的问题
 * 获取方式：
 *   网站1：https://commissions-yields-exception-personally.trycloudflare.com
 *   网站2：https://telecom.nufe.ccwu.cc
 * 使用步骤：
 *   1. 打开上述任一网站
 *   2. 使用短信登录授权设备
 *   3. 复制显示的设备 ID
 *   4. 在脚本设置中填写「设备ID（可选）」
 *   5. 若留空则自动生成随机设备ID（可能需要多次尝试）
 */

if (typeof require === 'undefined') require = importModule;
const { DmYY, Runing } = require('./DmYY');

class Widget extends DmYY {
  constructor(arg) {
    super(arg);
    this.name = "China Telecom";
    this.en = "ChinaTelecom_2024_Login";
    this.logo = "https://raw.githubusercontent.com/anker1209/icon/main/zgdx-big.png";
    this.smallLogo = "https://raw.githubusercontent.com/anker1209/icon/main/zgdx.png";
    this.Run();
  }

  version = '3.1.0-multi';

  gradient = false;

  flowColorHex = "#FF6620";
  voiceColorHex = "#78C100";

  ringStackSize = 65;
  ringTextSize = 14;
  feeTextSize = 21;
  textSize = 13;
  smallPadding = 12;
  padding = 10;
  logoScale = 0.24;
  SCALE = 1;

  canvSize = 178;
  canvWidth = 18;
  canvRadius = 80;

  widgetStyle = '1';
  currIndex = '1';

  format = (str) => {
    return parseInt(str) >= 10 ? str : `0${str}`;
  };

  date = new Date();
  arrUpdateTime = [
    this.format(this.date.getMonth() + 1),
    this.format(this.date.getDate()),
    this.format(this.date.getHours()),
    this.format(this.date.getMinutes()),
  ];

  fee = {
    title: "剩余话费",
    icon: 'antenna.radiowaves.left.and.right',
    number: '0',
    iconColor: new Color('#0C54D9'),
    unit: "元",
    en: "¥",
  };

  flow = {
    percent: 0,
    max: 40,
    title: "剩余流量",
    number: '0',
    unit: "GB",
    en: "GB",
    icon: "antenna.radiowaves.left.and.right",
    iconColor: new Color("#FF6620"),
    FGColor: new Color(this.flowColorHex),
    BGColor: new Color(this.flowColorHex, 0.2),
    colors: [],
  };

  voice = {
    percent: 0,
    title: "剩余语音",
    number: '0',
    unit: "分钟",
    en: "MIN",
    icon: 'phone.badge.waveform.fill',
    iconColor: new Color("#78C100"),
    FGColor: new Color(this.voiceColorHex),
    BGColor: new Color(this.voiceColorHex, 0.2),
    colors: [],
  };

  point = {
    title: "更新时间",
    number: `${this.arrUpdateTime[2]}:${this.arrUpdateTime[3]}`,
    unit: "",
    icon: "arrow.2.circlepath",
    iconColor: new Color("fc6d6d"),
  };

  // ==================== 辅助函数 ====================
  _safeN(v) {
    const n = typeof v === "number" ? v : parseFloat(v ?? "0");
    return Number.isFinite(n) ? n : 0;
  }

  _formatFlowMB(mb) {
    if (!Number.isFinite(mb) || mb <= 0) return { balance: "0", unit: "MB" };
    if (mb >= 1024) return { balance: (mb / 1024).toFixed(2), unit: "GB" };
    return { balance: Math.floor(mb).toString(), unit: "MB" };
  }

  _nowHHMM() {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }

  // ==================== 适配自定义API的数据转换 ====================
  _convertToCarrierData(apiData) {
    if (!apiData) throw new Error("电信：API 数据为空");

    // 话费（分转元）
    const balanceFen = this._safeN(apiData.balance);
    const remainFee = (balanceFen / 100).toFixed(2);

    // 语音
    const voiceTotal = this._safeN(apiData.voiceTotal);
    const voiceBalance = this._safeN(apiData.voiceBalance);
    let voiceUsed = this._safeN(apiData.voiceUsage);
    if (voiceUsed === 0 && voiceTotal > 0) {
      voiceUsed = voiceTotal - voiceBalance;
    }

    // 流量（KB转MB）
    const flowTotalKB = this._safeN(apiData.flowTotal);
    const flowUsedKB = this._safeN(apiData.flowUse);
    let flowBalanceKB = 0;
    if (apiData.flowItems && apiData.flowItems.length > 0) {
      flowBalanceKB = this._safeN(apiData.flowItems[0].balance);
    } else {
      flowBalanceKB = flowTotalKB - flowUsedKB;
    }

    const flowTotalMB = flowTotalKB / 1024;
    const flowUsedMB = flowUsedKB / 1024;
    const flowBalanceMB = flowBalanceKB / 1024;

    const flowFmt = this._formatFlowMB(flowBalanceMB);

    return {
      fee: {
        title: "剩余话费",
        balance: remainFee,
        unit: "元",
      },
      flow: {
        title: "通用流量",
        balance: flowFmt.balance,
        unit: flowFmt.unit,
        used: flowUsedMB,
        total: flowTotalMB,
      },
      otherFlow: undefined,
      voice: {
        title: "剩余语音",
        balance: voiceBalance.toString(),
        unit: "分钟",
        used: voiceUsed,
        total: voiceTotal,
      },
      updateTime: this._nowHHMM(),
    };
  }

  init = async () => {
    try {
      const scale = this.getWidgetScaleFactor();
      this.SCALE = this.settings.SCALE || scale;

      const {
        step1,
        step2,
        logoColor,
        flowIconColor,
        voiceIconColor,
        gradient,
        builtInColor,
        previewAccount
      } = this.settings;

      // 多账户支持：读取小组件参数
      let param = args.widgetParameter ? args.widgetParameter.toString() : (previewAccount || '1');
      if (!['1','2','3','4','5'].includes(param)) param = '1';
      
      this.currIndex = param;
      
      // 读取当前账户的配置
      this.widgetStyle = this.settings[`widgetStyle${param}`] || '1';

      this.gradient = gradient === 'true';

      if (builtInColor === 'true') {
        const [feeColor, flowColor, voiceColor] = this.getIconColorSet();
        this.fee.iconColor = new Color(feeColor);
        this.flow.iconColor = new Color(flowColor);
        this.voice.iconColor = new Color(voiceColor);
      } else {
        this.fee.iconColor = logoColor ? new Color(logoColor) : this.fee.iconColor;
        this.flow.iconColor = flowIconColor ? new Color(flowIconColor) : this.flow.iconColor;
        this.voice.iconColor = voiceIconColor ? new Color(voiceIconColor) : this.voice.iconColor;
      }

      this.flowColorHex = step1 || this.flowColorHex;
      this.voiceColorHex = step2 || this.voiceColorHex;
      this.flow.BGColor = new Color(this.flowColorHex, 0.2);
      this.voice.BGColor = new Color(this.voiceColorHex, 0.2);
      this.flow.FGColor = new Color(this.flowColorHex);
      this.voice.FGColor = new Color(this.voiceColorHex);


      const sizeSettings = [
        'ringStackSize',
        'ringTextSize',
        'feeTextSize',
        'textSize',
        'smallPadding',
        'padding',
      ];

      for (const key of sizeSettings) {
        this[key] = this.settings[key] ? parseFloat(this.settings[key]) : this[key];
        this[key] = this[key] * this.SCALE;
      }

      if (this.gradient) {
        this.flow.colors = this.arrColor();
        this.voice.colors = this.arrColor();
        this.flow.BGColor = new Color(this.flow.colors[1], 0.2);
        this.voice.BGColor = new Color(this.voice.colors[1], 0.2);
        this.flow.FGColor = this.gradientColor(this.flow.colors, 360);
        this.voice.FGColor = this.gradientColor(this.voice.colors, 360);
        this.flowColorHex = this.flow.colors[1];
        this.voiceColorHex = this.voice.colors[1];
      }

      // 从缓存加载数据
      if (this.settings.dataSource) {
        Object.keys(this.settings.dataSource).forEach((key) => {
          if (this[key] && typeof this.settings.dataSource[key] === "object") {
            Object.assign(this[key], this.settings.dataSource[key]);
          }
        });
        if (this.settings.dataSource.updateTime) {
          this.arrUpdateTime = this.settings.dataSource.updateTime.split(':');
        }
      }

    } catch (e) {
      console.error(e);
    }

    // 多账户检查：检查当前账户的配置
    const phoneKey = `telecom_phone${this.currIndex}`;
    const passwordKey = `telecom_password${this.currIndex}`;
    if (!this.settings[phoneKey] || !this.settings[passwordKey]) {
      if (config.runsInApp) {
        return this.notify(this.name, `请先为账户${this.currIndex}填写手机号和服务密码`);
      }
      return;
    }

    await this.getData();
  };

  // ==================== RSA 加密（WebView + JSEncrypt） ====================
 async rsaEncrypt(text) {
 const publicKey = "-----BEGIN PUBLIC KEY-----\n" +
   "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBkLT15ThVgz6/NOl6s8GNPofd\n" +
   "WzWbCkWnkaAm7O2LjkM1H7dMvzkiqdxU02jamGRHLX/ZNMCXHnPcW/sDhiFCBN18\n" +
   "qFvy8g6VYb9QtroI09e176s+ZCtiv7hbin2cCTj99iUpnEloZm19lwHyo69u5UMi\n" +
   "PMpq0/XKBO8lYhN/gwIDAQAB\n" +
   "-----END PUBLIC KEY-----";
 
 const escapedKey = publicKey.replace(/\n/g, "\\n");
 const escapedText = text.replace(/"/g, '\\"');
 
 const html = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
   '<script src="https://cdn.jsdelivr.net/npm/jsencrypt@3.3.2/bin/jsencrypt.min.js"></script>' +
   '</head><body><div id="result"></div><script>' +
   'try{' +
   'const e=new JSEncrypt();' +
   'e.setPublicKey("' + escapedKey + '");' +
   'const r=e.encrypt("' + escapedText + '");' +
   'document.getElementById("result").innerText=r||"ERROR:encryption_failed";' +
   '}catch(e){document.getElementById("result").innerText="ERROR:"+e.message}' +
   '</script></body></html>';
 
 const webView = new WebView();
 await webView.loadHTML(html);
 await webView.waitForLoad();
 
 const result = await webView.evaluateJavaScript('document.getElementById("result").innerText');
 
 if (!result || result.startsWith("ERROR")) {
   throw new Error("RSA加密失败: " + (result || "无响应"));
 }
 
 return result.trim();
 }

 transNumber(str, encode = true) {
 return [...str].map((c) => String.fromCharCode((c.charCodeAt(0) + (encode ? 2 : -2)) & 0xffff)).join("");
 }

 getBeijingTimestamp() {
 const bjDate = new Date(Date.now() + 8 * 3600 * 1000);
 const yyyy = String(bjDate.getFullYear());
 const MM = String(bjDate.getMonth() + 1).padStart(2, "0");
 const dd = String(bjDate.getDate()).padStart(2, "0");
 const HH = String(bjDate.getHours()).padStart(2, "0");
 const mm = String(bjDate.getMinutes()).padStart(2, "0");
 const ss = String(bjDate.getSeconds()).padStart(2, "0");
 return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
 }

 async telecomLogin() {
 const param = this.currIndex;
 const phonenum = this.settings[`telecom_phone${param}`];
 const password = this.settings[`telecom_password${param}`];
 const deviceid = this.settings[`telecom_deviceid${param}`] || "";
 const uuid = String(Math.floor(Math.random() * 9e15 + 1e15));
 const ts = this.getBeijingTimestamp();
 console.log("🔐 正在生成 RSA 签名...");
 const encryptText = `iPhone 14 15.4.0${deviceid || uuid.slice(0, 12)}${phonenum}${ts}${password}0$$$0.`;
 const encrypted = await this.rsaEncrypt(encryptText);
 const loginBody = {content:{fieldData:{loginType:"4",accountType:"",isChinatelecom:"",systemVersion:"15.4.0",deviceUid:uuid.slice(0,16),phoneNum:this.transNumber(phonenum),authentication:this.transNumber(password),androidId:deviceid?this.transNumber(deviceid):"",loginAuthCipherAsymmertric:encrypted},attach:"iPhone"},headerInfos:{code:"userLoginNormal",clientType:"#12.2.0#channel50#iPhone 14 Pro#",timestamp:ts,shopId:"20002",source:"110003",sourcePassword:"Sid98s",userLoginName:this.transNumber(phonenum)}};
 const req = new Request("https://appgologin.189.cn:9031/login/client/userLoginNormal");
 req.method = "POST";
 req.headers = {"Content-Type":"application/json; charset=UTF-8"};
 req.body = JSON.stringify(loginBody);
 req.timeoutInterval = 15;
 const loginResp = await req.loadString();
 const loginData = JSON.parse(loginResp);
 if (loginData.responseData?.resultCode !== "0000") throw new Error(loginData.responseData?.resultDesc || "登录失败");
 const {token,cityCode,provinceCode} = loginData.responseData.data.loginSuccessResult;
 this.settings[`telecom_token${param}`] = token;
 this.settings[`telecom_cityCode${param}`] = cityCode;
 this.settings[`telecom_provinceCode${param}`] = provinceCode;
 this.saveSettings(false);
 console.log(`✅ 登录成功 | 省:${provinceCode} 市:${cityCode}`);
 return {token,cityCode,provinceCode};
 }

 async fetchImportantData() {
 const param = this.currIndex;
 const phonenum = this.settings[`telecom_phone${param}`];
 const token = this.settings[`telecom_token${param}`] || "";
 const cityCode = this.settings[`telecom_cityCode${param}`] || "";
 const provinceCode = this.settings[`telecom_provinceCode${param}`] || "";
 const ts = this.getBeijingTimestamp();
 const dataBody = {content:{fieldData:{provinceCode,cityCode,shopId:"20002",isChinatelecom:"0",account:this.transNumber(phonenum)},attach:"test"},headerInfos:{code:"qryImportantData",clientType:"#12.2.0#channel50#iPhone 14 Pro#",timestamp:ts,shopId:"20002",source:"110003",sourcePassword:"Sid98s",userLoginName:this.transNumber(phonenum),token}};
 const req = new Request("https://appfuwu.189.cn:9021/query/qryImportantData");
 req.method = "POST";
 req.headers = {"Content-Type":"application/json; charset=UTF-8"};
 req.body = JSON.stringify(dataBody);
 req.timeoutInterval = 15;
 const dataResp = await req.loadString();
 return JSON.parse(dataResp);
 }

 // ==================== getData 方法（电信官方API） ====================
 getData = async () => {
   const param = this.currIndex;
   const phoneKey = `telecom_phone${param}`;
   const passwordKey = `telecom_password${param}`;
   
   if (!this.settings[phoneKey] || !this.settings[passwordKey]) {
     console.log(`❌ 账户[${param}] 未配置手机号或密码`);
     if (config.runsInApp) return this.notify(this.name, `请先为账户${param}填写手机号和服务密码`);
     return;
   }

   const fm = FileManager.local();
   const cacheDir = fm.joinPath(fm.documentsDirectory(), "ChinaTelecom_Cache");
   const cachePath = fm.joinPath(cacheDir, `account_${param}.json`);
   
   if (!fm.fileExists(cacheDir)) fm.createDirectory(cacheDir, true);

   const t0 = Date.now();
   console.log(`🚀 电信组件启动 (RSA登录) | 账户${param} | 手机号: ${this.settings[phoneKey].slice(-4)}`);
   
   let cached = null;
   let cacheAge = null;
   const CACHE_TTL = 30 * 60 * 1000;
   
   if (fm.fileExists(cachePath)) {
     const modified = fm.modificationDate(cachePath);
     cacheAge = Date.now() - modified.getTime();
     
     if (cacheAge < CACHE_TTL) {
       console.log(`🧠 使用缓存数据 | 缓存时间: ${Math.round(cacheAge / 60000)} 分钟前`);
       try {
         cached = JSON.parse(fm.readString(cachePath));
         Object.keys(cached).forEach((key) => {
           if (this[key] && typeof cached[key] === "object") {
             Object.assign(this[key], cached[key]);
           }
         });
         if (cached.updateTime) {
           this.arrUpdateTime = cached.updateTime.split(':');
         }
         console.log(`✅ 渲染完成 | 来源: 缓存 | 耗时: ${Date.now() - t0}ms`);
         return;
       } catch (e) {
         console.log(`⚠️ 缓存损坏，刷新数据`);
       }
     } else {
       console.log(`🔵 缓存已过期 (${Math.round(cacheAge / 60000)} > 30分)`);
     }
   }
 try {
 let dataResp;
 try {
 console.log("📡 尝试使用缓存 token 获取数据...");
 dataResp = await this.fetchImportantData();
 if (!dataResp.responseData) throw new Error("Token 失效");
 } catch (e) {
 console.log("🔄 Token 失效，重新登录...");
 await this.telecomLogin();
 console.log("✅ 登录成功，重新获取数据...");
 dataResp = await this.fetchImportantData();
 }
 if (!dataResp.responseData) throw new Error(dataResp.headerInfos?.reason || "获取数据失败");
 const apiData = dataResp.responseData.data;
 const balance = this._safeN(apiData.balanceInfo?.indexBalanceDataInfo?.balance || apiData.balance);
 this.fee.number = balance.toFixed(2);
 
 // 根据"过滤定向"设置选择流量数据源
 let flowUsed, flowTotal, flowBalance;
 if (this.settings.filterOrientateFlow === "true") {
   // 过滤定向：只显示通用流量 (commonFlow)
   flowUsed = this._safeN(apiData.flowInfo?.commonFlow?.used || 0);
   flowBalance = this._safeN(apiData.flowInfo?.commonFlow?.balance || 0);
   flowTotal = this._safeN(apiData.flowInfo?.commonFlow?.total || (flowUsed + flowBalance));
   console.log("📶 流量模式：仅通用流量（已过滤定向）");
 } else {
   // 不过滤：显示总流量 (totalAmount)
   flowUsed = this._safeN(apiData.flowInfo?.totalAmount?.used || apiData.usedFlux);
   flowBalance = this._safeN(apiData.flowInfo?.totalAmount?.balance || 0);
   flowTotal = this._safeN(apiData.flowInfo?.totalAmount?.total || (flowUsed + flowBalance));
   console.log("📶 流量模式：总流量（包含定向）");
 }
 
 const flowTotalMB = flowTotal / 1024;
 const flowUsedMB = flowUsed / 1024;
 const flowBalanceMB = flowBalance / 1024;
 
 let flowPercent = 0;
 if (flowTotalMB > 0) flowPercent = (flowUsedMB / flowTotalMB) * 100;
 this.flow.percent = flowPercent.toFixed(2);
 console.log(`📊 流量百分比: ${this.flow.percent}% (已用 ${flowUsedMB.toFixed(2)} MB / 总量 ${flowTotalMB.toFixed(2)} MB)`);
 
 // 根据"显示已用"设置选择显示内容
 if (this.settings.showUsedFlow === "true") {
   // 显示已用流量
   this.flow.title = "已用流量";
   this.flow.number = (flowUsedMB / 1024).toFixed(2);
   this.flow.unit = "GB";
   console.log(`📊 显示模式：已用流量 ${this.flow.number} GB`);
 } else {
   // 显示剩余流量
   this.flow.title = "剩余流量";
   const flowFmt = this._formatFlowMB(flowBalanceMB);
   this.flow.number = flowFmt.balance;
   this.flow.unit = flowFmt.unit;
   console.log(`📊 显示模式：剩余流量 ${this.flow.number} ${this.flow.unit}`);
 }
 this.flow.en = this.flow.unit;
 console.log("📞 语音原始数据:", JSON.stringify(apiData.voiceInfo?.voiceDataInfo || {}, null, 2));
 const voiceTotal = this._safeN(apiData.voiceInfo?.voiceDataInfo?.total || apiData.totalVoice);
 const voiceUsed = this._safeN(apiData.voiceInfo?.voiceDataInfo?.used || apiData.usedVoice);
 const voiceBalance = this._safeN(apiData.voiceInfo?.voiceDataInfo?.balance || (voiceTotal - voiceUsed));
 
 // 根据"显示已用"设置，语音也要同步显示已用或剩余
 if (this.settings.showUsedFlow === "true") {
   // 显示已用
   this.voice.title = "已用语音";
   this.voice.number = voiceUsed.toString();
   if (voiceTotal > 0) {
     this.voice.percent = ((voiceUsed / voiceTotal) * 100).toFixed(2);
   } else {
     this.voice.percent = "0";
   }
   console.log(`📞 语音（已用）: ${voiceUsed} 分钟, 百分比: ${this.voice.percent}%`);
 } else {
   // 显示剩余
   this.voice.title = "剩余语音";
   this.voice.number = voiceBalance.toString();
   if (voiceTotal > 0) {
     this.voice.percent = ((voiceBalance / voiceTotal) * 100).toFixed(2);
   } else {
     this.voice.percent = "0";
   }
   console.log(`📞 语音（剩余）: ${voiceBalance} 分钟, 百分比: ${this.voice.percent}%`);
 }
 const d = new Date();
 this.arrUpdateTime = [d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes()].map((n)=>n.toString().padStart(2,"0"));
 // 保存到独立缓存文件
 const cacheData = {fee:{number:this.fee.number},voice:{number:this.voice.number,percent:this.voice.percent},flow:{en:this.flow.en,number:this.flow.number,unit:this.flow.unit,percent:this.flow.percent,title:this.flow.title},updateTime:this.arrUpdateTime.join(":"),_timestamp:Date.now()};
 if (fm.fileExists(cachePath)) fm.remove(cachePath);
 fm.writeString(cachePath, JSON.stringify(cacheData));
 
 console.log(`✅ 渲染完成 | 来源: 电信官方API | 耗时: ${Date.now()-t0}ms | 话费: ${this.fee.number}元 流量: ${this.flow.number}${this.flow.unit} 语音: ${this.voice.number}分钟`);
 } catch (e) {
   let errorMessage = e.message || "未知错误";
   console.error(`⛔️ 电信渲染异常: ${errorMessage}`);
   if (fm.fileExists(cachePath)) {
     console.warn("⚠️ 使用过期缓存兜底");
     try {
       const oldCache = JSON.parse(fm.readString(cachePath));
       Object.keys(oldCache).forEach((key) => {
         if (this[key] && typeof oldCache[key] === "object") {
           Object.assign(this[key], oldCache[key]);
         }
       });
       if (oldCache.updateTime) {
         this.arrUpdateTime = oldCache.updateTime.split(':');
       }
     } catch (e2) {
       console.error("缓存读取失败");
     }
     if (config.runsInApp) this.notify(this.name, "网络连接失败，当前显示缓存数据");
   } else {
     if (config.runsInApp) this.notify(this.name, `获取失败: ${errorMessage}`);
   }
 }
 };
 // ==================== UI 渲染函数（完整保留） ====================
  async header(stack) {
    const headerStack = stack.addStack();
    headerStack.addSpacer();
    const logo = headerStack.addImage(await this.$request.get(this.logo, 'IMG'));
    logo.imageSize = new Size(415 * this.logoScale * this.SCALE, 125 * this.logoScale * this.SCALE);
    headerStack.addSpacer();
    stack.addSpacer();

    const feeStack = stack.addStack();
    feeStack.centerAlignContent();
    feeStack.addSpacer();
    const feeValue = feeStack.addText(`${this.fee.number}`);
    this.unit(feeStack, '元', 5 * this.SCALE, this.widgetColor);
    feeValue.font = Font.mediumRoundedSystemFont(this.feeTextSize);
    feeValue.textColor = this.widgetColor;
    feeStack.addSpacer();
    stack.addSpacer();
  }

  textLayout(stack, data) {
    const rowStack = stack.addStack();
    rowStack.centerAlignContent();
    const icon = SFSymbol.named(data.icon) || SFSymbol.named('phone.fill');
    icon.applyHeavyWeight();
    let iconElement = rowStack.addImage(icon.image);
    iconElement.imageSize = new Size(this.textSize, this.textSize);
    iconElement.tintColor = data.iconColor;
    rowStack.addSpacer(4 * this.SCALE);
    let title = rowStack.addText(data.title);
    rowStack.addSpacer();
    let number = rowStack.addText(data.number + data.unit);
    [title, number].map(t => t.textColor = this.widgetColor);
    [title, number].map(t => t.font = Font.systemFont(this.textSize * this.SCALE));
  }

  async setThirdWidget(widget) {
    const amountStack = widget.addStack();
    amountStack.centerAlignContent();

    const icon = await this.$request.get(this.smallLogo, 'IMG');

    if (this.settings.builtInColor === 'true') {
      const iconStack = amountStack.addStack();
      iconStack.setPadding(4 * this.SCALE, 4 * this.SCALE, 4 * this.SCALE, 4 * this.SCALE);
      iconStack.backgroundColor = this.fee.iconColor;
      iconStack.cornerRadius = 12 * this.SCALE;
      const iconImage = iconStack.addImage(icon);
      iconImage.imageSize = new Size(16 * this.SCALE, 16 * this.SCALE);
      iconImage.tintColor = Color.white();
    } else {
      const iconImage = amountStack.addImage(icon);
      iconImage.imageSize = new Size(24 * this.SCALE, 24 * this.SCALE);
    }

    amountStack.addSpacer();

    const amountText = amountStack.addText(`${this.fee.number}`);
    amountText.font = Font.boldRoundedSystemFont(24 * this.SCALE);
    amountText.minimumScaleFactor = 0.5;
    amountText.textColor = this.widgetColor;
    this.unit(amountStack, '元', 7 * this.SCALE);

    widget.addSpacer();

    const mainStack = widget.addStack();
    this.setRow(mainStack, this.flow, this.flowColorHex);
    mainStack.addSpacer();
    this.setRow(mainStack, this.voice, this.voiceColorHex);
  }

  async setForthWidget(widget) {
    const bodyStack = widget.addStack();
    bodyStack.cornerRadius = 14 * this.SCALE;
    bodyStack.layoutVertically();
    const headerStack = bodyStack.addStack();
    headerStack.setPadding(8 * this.SCALE, 12 * this.SCALE, 0, 12 * this.SCALE);
    headerStack.layoutVertically();
    const title = headerStack.addText(this.fee.title);
    title.font = Font.systemFont(12 * this.SCALE);
    title.textColor = this.widgetColor
    title.textOpacity = 0.7;
    const balanceStack = headerStack.addStack();
    const balanceText = balanceStack.addText(`${this.fee.number}`);
    balanceText.minimumScaleFactor = 0.5;
    balanceText.font = Font.boldRoundedSystemFont(22 * this.SCALE);
    const color = this.widgetColor;
    balanceText.textColor = color;
    this.unit(balanceStack, '元', 5 * this.SCALE, color);
    balanceStack.addSpacer();
    balanceStack.centerAlignContent();

    const icon = await this.$request.get(this.smallLogo, 'IMG');

    if (this.settings.builtInColor === 'true') {
      const iconStack = balanceStack.addStack();
      iconStack.setPadding(4 * this.SCALE, 4 * this.SCALE, 4 * this.SCALE, 4 * this.SCALE);
      iconStack.backgroundColor = this.fee.iconColor;
      iconStack.cornerRadius = 12 * this.SCALE;
      const iconImage = iconStack.addImage(icon);
      iconImage.imageSize = new Size(16 * this.SCALE, 16 * this.SCALE);
      iconImage.tintColor = Color.white();
    } else {
      const iconImage = balanceStack.addImage(icon);
      iconImage.imageSize = new Size(24 * this.SCALE, 24 * this.SCALE);
    }

    bodyStack.addSpacer();
    const mainStack = bodyStack.addStack();
    mainStack.setPadding(8 * this.SCALE, 12 * this.SCALE, 8 * this.SCALE, 12 * this.SCALE);
    mainStack.cornerRadius = 14 * this.SCALE;
    mainStack.backgroundColor = Color.dynamic(new Color("#E2E2E7", 0.3), new Color("#2C2C2F", 1));
    mainStack.layoutVertically();

    this.setList(mainStack, this.flow);
    mainStack.addSpacer();
    this.setList(mainStack, this.voice);
  }

  setList(stack, data) {
    const rowStack = stack.addStack();
    rowStack.centerAlignContent();
    const lineStack = rowStack.addStack();
    lineStack.size = new Size(8 * this.SCALE, 30 * this.SCALE);
    lineStack.cornerRadius = 4 * this.SCALE;

    lineStack.backgroundColor = data.iconColor;

    rowStack.addSpacer(10 * this.SCALE);

    const leftStack = rowStack.addStack();
    leftStack.layoutVertically();
    leftStack.addSpacer(2 * this.SCALE);

    const titleStack = leftStack.addStack();
    const title = titleStack.addText(data.title);
    title.font = Font.systemFont(10 * this.SCALE);
    title.textColor = this.widgetColor;
    title.textOpacity = 0.5;

    const valueStack = leftStack.addStack();
    valueStack.centerAlignContent();
    const value = valueStack.addText(`${data.number}`);
    value.font = Font.semiboldRoundedSystemFont(16 * this.SCALE);
    value.textColor = this.widgetColor;
    valueStack.addSpacer();

    const unitStack = valueStack.addStack();
    unitStack.cornerRadius = 4 * this.SCALE;
    unitStack.borderWidth = 1;
    unitStack.borderColor = data.iconColor;
    unitStack.setPadding(1, 3 * this.SCALE, 1, 3 * this.SCALE);
    unitStack.size = new Size(30 * this.SCALE, 0)
    unitStack.backgroundColor = Color.dynamic(data.iconColor, new Color(data.iconColor.hex, 0.3));
    const unit = unitStack.addText(data.en);
    unit.font = Font.mediumRoundedSystemFont(10 * this.SCALE);
    unit.textColor = Color.dynamic(Color.white(), data.iconColor);
  }

  setRow(stack, data, color) {
    const stackWidth = 68 * this.SCALE;
    const rowStack = stack.addStack();
    rowStack.layoutVertically();
    rowStack.size = new Size(stackWidth, 0);
    const image = this.gaugeChart(data, color);
    const imageStack = rowStack.addStack();
    imageStack.layoutVertically();
    imageStack.size = new Size(stackWidth, stackWidth);
    imageStack.backgroundImage = image;
    imageStack.addSpacer();
    const iconStack = imageStack.addStack();
    iconStack.addSpacer();
    const sfs = SFSymbol.named(data.icon) || SFSymbol.named('phone.fill');
    sfs.applyHeavyWeight();
    const icon = iconStack.addImage(sfs.image);
    icon.imageSize = new Size(22 * this.SCALE, 22 * this.SCALE);
    icon.tintColor = new Color(color);
    iconStack.addSpacer();
    imageStack.addSpacer(8 * this.SCALE);
    const unitStack = imageStack.addStack();
    unitStack.addSpacer();
    const innerStack = unitStack.addStack();
    innerStack.size = new Size(32 * this.SCALE, 0);
    innerStack.setPadding(1, 1, 1, 1);
    innerStack.backgroundColor = new Color(color);
    innerStack.cornerRadius = 4 * this.SCALE;
    const unit = innerStack.addText(data.en);
    unit.font = Font.semiboldRoundedSystemFont(10 * this.SCALE);
    unit.textColor = Color.white();
    unitStack.addSpacer();
    imageStack.addSpacer(4 * this.SCALE);

    const infoStack = rowStack.addStack();
    infoStack.cornerRadius = 12 * this.SCALE;
    infoStack.layoutVertically();
    let gradient = new LinearGradient();
    gradient.colors = [new Color(color, 0.1), new Color(color, 0.01)];
    gradient.locations = [0, 1];
    gradient.startPoint = new Point(0, 0);
    gradient.endPoint = new Point(0, 1);
    infoStack.backgroundGradient = gradient;

    const valueStack = infoStack.addStack();
    valueStack.size = new Size(stackWidth, 0);
    valueStack.setPadding(3 * this.SCALE, 0, 2 * this.SCALE, 0)
    const value = valueStack.addText(`${data.number}`);
    value.textColor = this.widgetColor;
    value.font = Font.semiboldRoundedSystemFont(18 * this.SCALE);
    value.centerAlignText();

    const titleStack = infoStack.addStack();
    titleStack.addSpacer();
    const title = titleStack.addText(data.title);
    title.font = Font.regularRoundedSystemFont(9 * this.SCALE);
    title.textOpacity = 0.5;
    titleStack.addSpacer();
  }

  async small(stack, data, logo = false, en = false) {
    const bg = new LinearGradient();
    bg.locations = [0, 1];
    bg.endPoint = new Point(1, 0)
    bg.colors = [
      new Color(data.iconColor.hex, 0.1),
      new Color(data.iconColor.hex, 0.03)
    ];
    const rowStack = stack.addStack();
    rowStack.centerAlignContent();
    rowStack.setPadding(5, 8, 5, 8)
    rowStack.backgroundGradient = bg;
    rowStack.cornerRadius = 12;
    const leftStack = rowStack.addStack();
    leftStack.layoutVertically();
    const titleStack = leftStack.addStack();
    const title = titleStack.addText(data.title);
    const balanceStack = leftStack.addStack();
    balanceStack.centerAlignContent();
    const balanceUnit = en ? data.en : ''
    const balance = balanceStack.addText(`${data.number} ${balanceUnit}`);
    if (!en) this.addChineseUnit(balanceStack, data.unit, data.iconColor, 13 * this.SCALE);
    balance.font = Font.semiboldRoundedSystemFont(16 * this.SCALE);
    title.textOpacity = 0.5;
    title.font = Font.mediumSystemFont(11 * this.SCALE);
    [title, balance].map(t => t.textColor = data.iconColor);
    rowStack.addSpacer();
    let iconImage;
    if (logo) {
      const icon = await this.$request.get(this.smallLogo, 'IMG');
      iconImage = rowStack.addImage(icon);
    } else {
      const icon = SFSymbol.named(data.icon) || SFSymbol.named('phone.fill');
      icon.applyHeavyWeight();
      iconImage = rowStack.addImage(icon.image);
    };
    iconImage.imageSize = new Size(22 * this.SCALE, 22 * this.SCALE);
    iconImage.tintColor = data.iconColor;
  }

  async smallCell(stack, data, logo = false, en = false) {
    const bg = new LinearGradient();
    const padding = 6 * this.SCALE;
    bg.locations = [0, 1];
    bg.endPoint = new Point(1, 0)
    bg.colors = [
      new Color(data.iconColor.hex, 0.03),
      new Color(data.iconColor.hex, 0.1)
    ];
    const rowStack = stack.addStack();
    rowStack.setPadding(4, 4, 4, 4)
    rowStack.backgroundGradient = bg;
    rowStack.cornerRadius = 12;
    const iconStack = rowStack.addStack();
    iconStack.backgroundColor = data.iconColor;
    iconStack.setPadding(padding, padding, padding, padding);
    iconStack.cornerRadius = 17 * this.SCALE;
    let iconImage;
    if (logo) {
      const icon = await this.$request.get(this.smallLogo, 'IMG');
      iconImage = iconStack.addImage(icon);
    } else {
      const icon = SFSymbol.named(data.icon) || SFSymbol.named('phone.fill');
      icon.applyHeavyWeight();
      iconImage = iconStack.addImage(icon.image);
    };
    iconImage.imageSize = new Size(22 * this.SCALE, 22 * this.SCALE);
    iconImage.tintColor = new Color('FFFFFF');
    rowStack.addSpacer(15);
    const rightStack = rowStack.addStack();
    rightStack.layoutVertically();
    const balanceStack = rightStack.addStack();
    balanceStack.centerAlignContent();
    const balanceUnit = en ? data.en : ''
    const balance = balanceStack.addText(`${data.number} ${balanceUnit}`);
    if (!en) this.addChineseUnit(balanceStack, data.unit, data.iconColor, 13 * this.SCALE);
    balance.font = Font.semiboldRoundedSystemFont(16 * this.SCALE);
    const titleStack = rightStack.addStack();
    const title = titleStack.addText(data.title);
    title.centerAlignText();
    rowStack.addSpacer();
    title.textOpacity = 0.5;
    title.font = Font.mediumSystemFont(11 * this.SCALE);
    [title, balance].map(t => t.textColor = data.iconColor);
  }

  async mediumCell(canvas, stack, data, color, fee = false, percent) {
    const bg = new LinearGradient();
    bg.locations = [0, 1];
    bg.colors = [
      new Color(color, 0.03),
      new Color(color, 0.1)
    ];
    const dataStack = stack.addStack();
    dataStack.backgroundGradient = bg;
    dataStack.cornerRadius = 15;
    dataStack.layoutVertically();
    dataStack.addSpacer();

    const topStack = dataStack.addStack();
    topStack.addSpacer();
    await this.imageCell(canvas, topStack, data, fee, percent);
    topStack.addSpacer();

    if (fee) {
      dataStack.addSpacer(5);
      const updateStack = dataStack.addStack();
      updateStack.addSpacer();
      updateStack.centerAlignContent();
      const updataIcon = SFSymbol.named('arrow.2.circlepath');
      updataIcon.applyHeavyWeight();
      const updateImg = updateStack.addImage(updataIcon.image);
      updateImg.tintColor = new Color(color, 0.6);
      updateImg.imageSize = new Size(10, 10);
      updateStack.addSpacer(3);
      const updateText = updateStack.addText(`${this.arrUpdateTime[2]}:${this.arrUpdateTime[3]}`)
      updateText.font = Font.mediumSystemFont(10);
      updateText.textColor = new Color(color, 0.6);
      updateStack.addSpacer();
    }

    dataStack.addSpacer();

    const numberStack = dataStack.addStack();
    numberStack.addSpacer();
    const number = numberStack.addText(`${data.number} ${data.en}`);
    number.font = Font.semiboldSystemFont(15);
    numberStack.addSpacer();

    dataStack.addSpacer(3);

    const titleStack = dataStack.addStack();
    titleStack.addSpacer();
    const title = titleStack.addText(data.title);
    title.font = Font.mediumSystemFont(11);
    title.textOpacity = 0.7;
    titleStack.addSpacer();

    dataStack.addSpacer(15);
    [title, number].map(t => t.textColor = new Color(color));
  }

  async imageCell(canvas, stack, data, fee, percent) {
    const canvaStack = stack.addStack();
    canvaStack.layoutVertically();
    if (!fee) {
      this.drawArc(canvas, data.percent * 3.6, data.FGColor, data.BGColor);
      canvaStack.size = new Size(this.ringStackSize, this.ringStackSize);
      canvaStack.backgroundImage = canvas.getImage();
      this.ringContent(canvaStack, data, percent);
    } else {
      canvaStack.addSpacer(10);
      const smallLogo = await this.$request.get(this.smallLogo, 'IMG');
      const logoStack = canvaStack.addStack();
      logoStack.size = new Size(40, 40);
      logoStack.backgroundImage = smallLogo;
    }
  }

  ringContent(stack, data, percent = false) {
    const rowIcon = stack.addStack();
    rowIcon.addSpacer();
    const icon = SFSymbol.named(data.icon) || SFSymbol.named('phone.fill');
    icon.applyHeavyWeight();
    const iconElement = rowIcon.addImage(icon.image);
    iconElement.tintColor = this.gradient ? new Color(data.colors[1]) : data.FGColor;
    iconElement.imageSize = new Size(12, 12);
    iconElement.imageOpacity = 0.7;
    rowIcon.addSpacer();

    stack.addSpacer(1);

    const rowNumber = stack.addStack();
    rowNumber.addSpacer();
    const number = rowNumber.addText(percent ? `${data.percent}` : `${data.number}`);
    number.font = percent ? Font.systemFont(this.ringTextSize - 2) : Font.mediumSystemFont(this.ringTextSize);
    rowNumber.addSpacer();

    const rowUnit = stack.addStack();
    rowUnit.addSpacer();
    const unit = rowUnit.addText(percent ? '%' : data.unit);
    unit.font = Font.boldSystemFont(8);
    unit.textOpacity = 0.5;
    rowUnit.addSpacer();

    if (percent) {
      if (this.gradient) {
        [unit, number].map(t => t.textColor = new Color(data.colors[1]));
      } else {
        [unit, number].map(t => t.textColor = data.FGColor);
      }
    } else {
      [unit, number].map(t => t.textColor = this.widgetColor);
    }
  }

  makeCanvas() {
    const canvas = new DrawContext();
    canvas.opaque = false;
    canvas.respectScreenScale = true;
    canvas.size = new Size(this.canvSize, this.canvSize);
    return canvas;
  }

  sinDeg(deg) {
    return Math.sin((deg * Math.PI) / 180);
  }

  cosDeg(deg) {
    return Math.cos((deg * Math.PI) / 180);
  }

  drawArc(canvas, deg, fillColor, strokeColor) {
    let ctr = new Point(this.canvSize / 2, this.canvSize / 2);
    let bgx = ctr.x - this.canvRadius;
    let bgy = ctr.y - this.canvRadius;
    let bgd = 2 * this.canvRadius;
    let bgr = new Rect(bgx, bgy, bgd, bgd)

    canvas.setStrokeColor(strokeColor);
    canvas.setLineWidth(this.canvWidth);
    canvas.strokeEllipse(bgr);

    for (let t = 0; t < deg; t++) {
      let rect_x = ctr.x + this.canvRadius * this.sinDeg(t) - this.canvWidth / 2;
      let rect_y = ctr.y - this.canvRadius * this.cosDeg(t) - this.canvWidth / 2;
      let rect_r = new Rect(rect_x, rect_y, this.canvWidth, this.canvWidth);
      canvas.setFillColor(this.gradient ? new Color(fillColor[t]) : fillColor);
      canvas.setStrokeColor(strokeColor)
      canvas.fillEllipse(rect_r);
    }
  }

  fillRect(drawing, x, y, width, height, cornerradio, color) {
    let path = new Path();
    let rect = new Rect(x, y, width, height);
    path.addRoundedRect(rect, cornerradio, cornerradio);
    drawing.addPath(path);
    drawing.setFillColor(color);
    drawing.fillPath();
  }

  progressBar(data) {
    const W = 60, H = 9, r = 4.5, h = 3;
    const drawing = this.makeCanvas(W, H);
    const progress = data.percent / 100 * W;
    const circle = progress - 2 * r;
    const fgColor = data.iconColor;
    const bgColor = new Color(data.iconColor.hex, 0.3);
    const pointerColor = data.iconColor;
    this.fillRect(drawing, 0, (H - h) / 2, W, h, h / 2, bgColor);
    this.fillRect(drawing, 0, (H - h) / 2, progress > W ? W : progress < r * 2 ? r * 2 : progress, h, h / 2, fgColor);
    this.fillRect(drawing, circle > W - r * 2 ? W - r * 2 : circle < 0 ? 0 : circle, H / 2 - r, r * 2, r * 2, r, pointerColor);
    return drawing.getImage();
  }

  gaugeChart(data, color) {
    const drawing = this.makeCanvas();
    const center = new Point(this.canvSize / 2, this.canvSize / 2);
    const radius = this.canvSize / 2 - 10;
    const circleRadius = 8;
    const startBgAngle = (10 * Math.PI) / 12;
    const endBgAngle = (26 * Math.PI) / 12;
    const totalBgAngle = endBgAngle - startBgAngle;
    const gapAngle = Math.PI / 80;
    const fillColor = data.BGColor;
    const lineWidth = circleRadius * 2;
    let progress = data.percent / 100;

    this.drawLineArc(drawing, center, radius, startBgAngle, endBgAngle, 1, fillColor, lineWidth);

    this.drawHalfCircle(center.x + radius * Math.cos(startBgAngle), center.y + radius * Math.sin(startBgAngle), startBgAngle, circleRadius, drawing, fillColor, -1);
    this.drawHalfCircle(center.x + radius * Math.cos(endBgAngle), center.y + radius * Math.sin(endBgAngle), endBgAngle, circleRadius, drawing, fillColor, 1);

    let totalProgressAngle = totalBgAngle * progress;
    for (let i = 0; i < 240 * progress; i++) {
      const t = i / 240;
      const angle = startBgAngle + totalBgAngle * t;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);

      const circleRect = new Rect(x - circleRadius, y - circleRadius, circleRadius * 2, circleRadius * 2);
      drawing.setFillColor(this.gradient ? new Color(data.FGColor[i]) : data.FGColor);
      drawing.fillEllipse(circleRect);
    }
    return drawing.getImage();
  }

  drawHalfCircle(centerX, centerY, startAngle, circleRadius, context, fillColor, direction = 1) {
    const halfCirclePath = new Path();
    const startX = centerX + circleRadius * Math.cos(startAngle);
    const startY = centerY + circleRadius * Math.sin(startAngle);
    halfCirclePath.move(new Point(startX, startY));

    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const angle = startAngle + direction * Math.PI * t;
      const x = centerX + circleRadius * Math.cos(angle);
      const y = centerY + circleRadius * Math.sin(angle);
      halfCirclePath.addLine(new Point(x, y));
    }

    context.setFillColor(fillColor);
    context.addPath(halfCirclePath);
    context.fillPath();
  }

  drawLineArc(context, center, radius, startAngle, endAngle, segments, fillColor, lineWidth, dir = 1) {
    const path = new Path();
    const startX = center.x + radius * Math.cos(startAngle);
    const startY = center.y + radius * Math.sin(startAngle);
    path.move(new Point(startX, startY));

    const steps = 100;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const angle = startAngle + (endAngle - startAngle) * t;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      path.addLine(new Point(x, y));
    }

    context.setStrokeColor(fillColor);
    context.setLineWidth(lineWidth);
    context.addPath(path);
    context.strokePath();
  }

  addChineseUnit(stack, text, color, size) {
    let textElement = stack.addText(text);
    textElement.textColor = color;
    textElement.font = Font.semiboldSystemFont(size);
    return textElement;
  }

  unit(stack, text, spacer, color = this.widgetColor) {
    stack.addSpacer(1);
    const unitStack = stack.addStack();
    unitStack.layoutVertically();
    unitStack.addSpacer(spacer);
    const unitTitle = unitStack.addText(text);
    unitTitle.font = Font.semiboldRoundedSystemFont(10);
    unitTitle.textColor = color;
  }

  arrColor() {
    let colorArr = [
      ["#FFF000", "#E62490"],
      ["#ABDCFF", "#0396FF"],
      ["#FEB692", "#EA5455"],
      ["#FEB692", "#EA5455"],
      ["#CE9FFC", "#7367F0"],
      ["#90F7EC", "#32CCBC"],
      ["#FFF6B7", "#F6416C"],
      ["#E2B0FF", "#9F44D3"],
      ["#F97794", "#F072B6"],
      ["#FCCF31", "#F55555"],
      ["#5EFCE8", "#736EFE"],
      ["#FAD7A1", "#E96D71"],
      ["#FFFF1C", "#00C3FF"],
      ["#FEC163", "#DE4313"],
      ["#F6CEEC", "#D939CD"],
      ["#FDD819", "#E80505"],
      ["#FFF3B0", "#CA26FF"],
      ["#EECDA3", "#EF629F"],
      ["#C2E59C", "#64B3F4"],
      ["#FFF886", "#F072B6"],
      ["#F5CBFF", "#C346C2"],
      ["#FFF720", "#3CD500"],
      ["#FFC371", "#FF5F6D"],
      ["#FFD3A5", "#FD6585"],
      ["#C2FFD8", "#465EFB"],
      ["#FFC600", "#FD6E6A"],
      ["#FFC600", "#FD6E6A"],
      ["#92FE9D", "#00C9FF"],
      ["#FFDDE1", "#EE9CA7"],
      ["#F0FF00", "#58CFFB"],
      ["#FFE985", "#FA742B"],
      ["#72EDF2", "#5151E5"],
      ["#F6D242", "#FF52E5"],
      ["#F9D423", "#FF4E50"],
      ["#00EAFF", "#3C8CE7"],
      ["#FCFF00", "#FFA8A8"],
      ["#FF96F9", "#C32BAC"],
      ["#FFDD94", "#FA897B"],
      ["#FFCC4B", "#FF7D58"],
      ["#D0E6A5", "#86E3CE"],
      ["#F0D5B6", "#F16238"],
      ["#C4E86B", "#00BCB4"],
      ["#FFC446", "#FA0874"],
      ["#E1EE32", "#FFB547"],
      ["#E9A6D2", "#E9037B"],
      ["#F8EC70", "#49E2F6"],
      ["#A2F8CD", "#00C3FF"],
      ["#FDEFE2", "#FE214F"],
      ["#FFB7D1", "#E4B7FF"],
      ["#D0E6A5", "#86E3CE"],
      ["#E8E965", "#64C5C7"]
    ];
    let colors = colorArr[Math.floor(Math.random() * colorArr.length)];
    return colors;
  }

  getIconColorSet() {
    const colors = [
      ["#1E81B0", "#FF5714", "#FF6347"],
      ["#FF6347", "#32CD32", "#3CB371"],
      ["#FF8C00", "#4682B4", "#20B2AA"],
      ["#FF4500", "#00CED1", "#00BFFF"],
      ["#DB7093", "#3CB371", "#FFA07A"],
      ["#FF8C00", "#4682B4", "#20B2AA"],
      ["#FF7F50", "#4CAF50", "#1E90FF"],
      ["#FF4500", "#00CED1", "#1E90FF"],
      ["#FF4500", "#3CB371", "#FFA07A"],
      ["#FF7F50", "#00A9A5", "#C41E3A"],
      ["#2E8B57", "#FF6347", "#00BFFF"],
      ["#FF4500", "#008B8B", "#3CB371"],
      ["#DC143C", "#00BFFF", "#F08080"],
      ["#20B2AA", "#FF8C00", "#32CD32"],
      ["#FF4500", "#66E579", "#00CED1"],
      ["#DA70D6", "#5DB8E8", "#FF6347"],
      ["#32CD32", "#F86527", "#00CED1"],
      ["#FF6347", "#00FA9A", "#20B2AA"],
      ["#FA8072", "#4682B4", "#3CB371"],
      ["#5856CF", "#FF4500", "#00BFFF"],
      ["#FF8C00", "#20B2AA", "#5856CF"],
      ["#704CE4", "#20B2AA", "#FF8F8F"],
      ["#73DE00", "#48D1CC", "#FF6347"],
      ["#DB7093", "#6495ED", "#FA8072"],
      ["#FFA07A", "#32CD32", "#1E90FF"],
      ["#00A9A5", "#FF4500", "#4682B4"],
      ["#13C07E", "#00BCD4", "#FF6347"],
      ["#8BC34A", "#FF5722", "#3F51B5"],
      ["#4CAF50", "#00BCD4", "#F44336"],
      ["#3F51B5", "#009688", "#FF5722"],
      ["#B170FF", "#03A9F4", "#3CB371"],
      ["#009688", "#8BC34A", "#FF6347"],
      ["#F44336", "#00BCD4", "#3CB371"],
      ["#FF4500", "#32CD32", "#3CB371"],
      ["#3CB371", "#FF9800", "#009688"],
      ["#4CAF50", "#00BCD4", "#F44336"],
      ["#FF5722", "#8BC34A", "#38B1B7"],
      ["#03A9F4", "#3CB371", "#FF788B"],
      ["#FF5722", "#03A9F4", "#DB7093"],
      ["#1E90FF", "#38B1B7", "#CD5C5C"],
      ["#FF6347", "#48D1CC", "#32CD32"],
      ["#FF4500", "#73DE00", "#4682B4"],
      ["#FF5722", "#8BC34A", "#00CED1"],
      ["#FF4500", "#32CD32", "#4682B4"],
      ["#8BC34A", "#F08080", "#00BFFF"],
      ["#FF6F61", "#40E0D0", "#1E90FF"],
      ["#00CED1", "#FF6347", "#4682B4"],
      ["#E57373", "#4DD0E1", "#81C784"],
      ["#FF5722", "#8BC34A", "#FFD700"],
      ["#F08080", "#48D1CC", "#32CD32"],
    ];
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  }

  gradientColor(colors, step) {
    var startRGB = this.colorToRgb(colors[0]),
      startR = startRGB[0],
      startG = startRGB[1],
      startB = startRGB[2];

    var endRGB = this.colorToRgb(colors[1]),
      endR = endRGB[0],
      endG = endRGB[1],
      endB = endRGB[2];

    var sR = (endR - startR) / step,
      sG = (endG - startG) / step,
      sB = (endB - startB) / step;

    var colorArr = [];
    for (var i = 0; i < step; i++) {
      var hex = this.colorToHex('rgb(' + parseInt((sR * i + startR)) + ',' + parseInt((sG * i + startG)) + ',' + parseInt((sB * i + startB)) + ')');
      colorArr.push(hex);
    }
    return colorArr;
  }

  colorToRgb(sColor) {
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    var sColor = sColor.toLowerCase();
    if (sColor && reg.test(sColor)) {
      if (sColor.length === 4) {
        var sColorNew = "#";
        for (var i = 1; i < 4; i += 1) {
          sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
        }
        sColor = sColorNew;
      }
      var sColorChange = [];
      for (var i = 1; i < 7; i += 2) {
        sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
      }
      return sColorChange;
    } else {
      return sColor;
    }
  }

  colorToHex(rgb) {
    var _this = rgb;
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    if (/^(rgb|RGB)/.test(_this)) {
      var aColor = _this.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
      var strHex = "#";
      for (var i = 0; i < aColor.length; i++) {
        var hex = Number(aColor[i]).toString(16);
        hex = hex.length < 2 ? 0 + '' + hex : hex;
        if (hex === "0") {
          hex += hex;
        }
        strHex += hex;
      }
      if (strHex.length !== 7) {
        strHex = _this;
      }
      return strHex;
    } else if (reg.test(_this)) {
      var aNum = _this.replace(/#/, "").split("");
      if (aNum.length === 6) {
        return _this;
      } else if (aNum.length === 3) {
        var numHex = "#";
        for (var i = 0; i < aNum.length; i += 1) {
          numHex += (aNum[i] + aNum[i]);
        }
        return numHex;
      }
    } else {
      return _this;
    }
  }

  getWidgetScaleFactor() {
    const referenceScreenSize = { width: 430, height: 932, widgetSize: 170 };
    const screenData = [
      { width: 440, height: 956, widgetSize: 170 },
      { width: 430, height: 932, widgetSize: 170 },
      { width: 428, height: 926, widgetSize: 170 },
      { width: 414, height: 896, widgetSize: 169 },
      { width: 414, height: 736, widgetSize: 159 },
      { width: 393, height: 852, widgetSize: 158 },
      { width: 390, height: 844, widgetSize: 158 },
      { width: 375, height: 812, widgetSize: 155 },
      { width: 375, height: 667, widgetSize: 148 },
      { width: 360, height: 780, widgetSize: 155 },
      { width: 320, height: 568, widgetSize: 141 }
    ];

    const deviceScreenWidth = Device.screenSize().width;
    const deviceScreenHeight = Device.screenSize().height;

    const matchingScreen = screenData.find(screen =>
      (screen.width === deviceScreenWidth && screen.height === deviceScreenHeight) ||
      (screen.width === deviceScreenHeight && screen.height === deviceScreenWidth)
    );

    if (!matchingScreen) {
      return 1;
    };

    const scaleFactor = matchingScreen.widgetSize / referenceScreenSize.widgetSize;

    return Math.floor(scaleFactor * 100) / 100;
  }

  async checkAndUpdateScript() {
    const remoteScriptUrl = "https://raw.githubusercontent.com/githubdulong/Script/master/Scriptable/ChinaTelecom_Multi.js";
    const scriptName = Script.name() + '.js'

    console.log("正在检查更新...")

    try {
      const request = new Request(remoteScriptUrl);
      const newScriptContent = await request.loadString();

      let versionPattern = /version\s*=\s*['"]([^'"]+)['"]/ ;
      let match = newScriptContent.match(versionPattern);

      if (!match) {
        console.log("未在远程代码中找到版本号");
        const alert = new Alert();
        alert.title = "检查失败";
        alert.message = "远程脚本格式可能不正确，未找到版本号。";
        alert.addAction("确定");
        await alert.present();
        return;
      }

      const latestVersion = match[1];
      const isUpdateAvailable = this.version !== latestVersion;

      if (isUpdateAvailable) {
        const alert = new Alert();
        alert.title = "检测到新版本";
        alert.message = `当前版本：${this.version}\n新版本：${latestVersion}\n是否更新？`;
        alert.addAction("更新");
        alert.addCancelAction("取消");

        const response = await alert.presentAlert();
        if (response === 0) {
          const fm = FileManager[
            module.filename.includes('Documents/iCloud~') ? 'iCloud' : 'local'
          ]();
          const scriptPath = fm.documentsDirectory() + `/${scriptName}`;
          fm.writeString(scriptPath, newScriptContent);

          const successAlert = new Alert();
          successAlert.title = "更新成功";
          successAlert.message = "脚本已更新，请关闭本脚本后重新打开!";
          successAlert.addAction("确定");
          await successAlert.present();
          // this.reopenScript();
        }
      } else {
        const noUpdateAlert = new Alert();
        noUpdateAlert.title = "无需更新";
        noUpdateAlert.message = "当前已是最新版本。";
        noUpdateAlert.addAction("确定");
        await noUpdateAlert.present();
      }
    } catch (e) {
      console.error(e);
      const alert = new Alert();
      alert.title = "更新出错";
      alert.message = "网络请求失败或地址错误：" + e.message;
      alert.addAction("确定");
      await alert.present();
    }
  }

  getAccountMenu(index) {
   return [
     {
       menu: [
         {
           url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/basic.png',
           type: 'input',
           title: `账户 ${index} 手机号`,
           desc: '请输入中国电信手机号',
           val: `telecom_phone${index}`,
         },
         {
           url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/login.png',
           type: 'input',
           title: `账户 ${index} 服务密码`,
           desc: '请输入服务密码(6位数字)',
           val: `telecom_password${index}`,
         },
         {
           url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/basic.png',
           type: 'input',
           title: `账户 ${index} 设备ID（可选）`,
           desc: '留空则自动生成随机设备ID',
           val: `telecom_deviceid${index}`,
         },
         {
           url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/widgetStyle.png',
           type: 'select',
           title: `账户 ${index} 组件样式`,
           options: ['1', '2', '3', '4', '5', '6'],
           val: `widgetStyle${index}`,
           desc: '默认使用样式1'
         },
       ]
     }
   ];
 }

 setAccountConfig = async () => {
    return this.renderAppView([
      {
        title: '电信账号设置',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/basic.png',
            type: 'input',
            title: '手机号码',
            desc: '请输入中国电信手机号',
            val: 'telecom_phone',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/login.png',
            type: 'input',
            title: '服务密码',
            desc: '请输入服务密码(6位数字)',
            val: 'telecom_password',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/basic.png',
            type: 'input',
            title: '设备ID（可选）',
            desc: '留空则自动生成随机设备ID',
            val: 'telecom_deviceid',
          },
        ],
      }
    ]);
  }

  renderSmall = async (w) => {
    w.setPadding(this.smallPadding, this.smallPadding, this.smallPadding, this.smallPadding);
    if (this.widgetStyle == "1") {
      const bodyStack = w.addStack();
      bodyStack.layoutVertically();
      await this.small(bodyStack, this.fee, true);
      bodyStack.addSpacer();
      await this.small(bodyStack, this.flow, false, true);
      bodyStack.addSpacer();
      await this.small(bodyStack, this.voice);
    } else if (this.widgetStyle == "2") {
      const bodyStack = w.addStack();
      bodyStack.layoutVertically();
      await this.smallCell(bodyStack, this.fee, true);
      bodyStack.addSpacer();
      await this.smallCell(bodyStack, this.flow, false, true);
      bodyStack.addSpacer();
      await this.smallCell(bodyStack, this.voice);
    } else if (this.widgetStyle == "3") {
      const bodyStack = w.addStack();
      bodyStack.layoutVertically();
      await this.setThirdWidget(bodyStack);
    } else if (this.widgetStyle == "4") {
      const bodyStack = w.addStack();
      bodyStack.layoutVertically();
      await this.setForthWidget(bodyStack);
    } else if (this.widgetStyle == "5") {
      const bodyStack = w.addStack();
      bodyStack.layoutVertically();
      await this.header(bodyStack);
      const canvas = this.makeCanvas();
      const ringStack = bodyStack.addStack();
      this.imageCell(canvas, ringStack, this.flow);
      ringStack.addSpacer();
      this.imageCell(canvas, ringStack, this.voice);
    } else {
      const bodyStack = w.addStack();
      bodyStack.layoutVertically();
      await this.header(bodyStack);
      this.textLayout(bodyStack, this.flow);
      bodyStack.addSpacer(7);
      this.textLayout(bodyStack, this.voice);
      bodyStack.addSpacer(7);
      this.textLayout(bodyStack, this.point);
    }
    return w;
  }

  renderMedium = async (w) => {
    w.setPadding(this.padding, this.padding, this.padding, this.padding);
    const canvas = this.makeCanvas();
    const bodyStack = w.addStack();
    await this.mediumCell(canvas, bodyStack, this.fee, '0A4B9D', true);
    bodyStack.addSpacer(this.padding);
    await this.mediumCell(canvas, bodyStack, this.flow, this.flowColorHex, false, true);
    bodyStack.addSpacer(this.padding);
    await this.mediumCell(canvas, bodyStack, this.voice, this.voiceColorHex, false, true);
    return w;
  };

  renderWebView = async () => {
    const webView = new WebView();
    const url = this.fetchUrl.login;
    await webView.loadURL(url);
    await webView.present(false);
  };

  setColorConfig = async () => {
    return this.renderAppView([
      {
        title: '颜色设置',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/gradient.png',
            type: 'switch',
            title: '渐变进度条',
            desc: '',
            val: 'gradient',
          },
        ],
      },
      {
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/step1.png',
            type: 'color',
            title: '流量进度条',
            defaultValue: '#FF6620',
            desc: '',
            val: 'step1',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/step2.png',
            type: 'color',
            title: '语音进度条',
            defaultValue: '#78C100',
            desc: '',
            val: 'step2',
          },
        ],
      },
      {
        title: '颜色设置',
        menu: [
          {
            url: 'https://pic1.imgdb.cn/item/63315c1e16f2c2beb1a27363.png',
            type: 'switch',
            title: '内置图标颜色',
            desc: '',
            val: 'builtInColor',
          },
        ],
      },
      {
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/logoColor.png',
            type: 'color',
            title: 'LOGO图标颜色',
            defaultValue: '#0C54D9',
            desc: '',
            val: 'logoColor',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/flowIconColor.png',
            type: 'color',
            title: '流量图标颜色',
            defaultValue: '#FF6620',
            desc: '',
            val: 'flowIconColor',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/voiceIconColor.png',
            type: 'color',
            title: '语音图标颜色',
            defaultValue: '#78C100',
            desc: '',
            val: 'voiceIconColor',
          },
        ],
      },
      {
        title: '重置颜色',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/clear.png',
            title: '重置颜色',
            desc: '重置当前颜色配置',
            name: 'reset',
            val: 'reset',
            onClick: () => {
              const propertiesToDelete = ['gradient', 'step1', 'step2', 'inner1', 'inner2', 'logoColor', 'flowIconColor', 'voiceIconColor'];
              propertiesToDelete.forEach(prop => {
                delete this.settings[prop];
              });
              this.saveSettings();
              this.reopenScript();
            },
          },
        ],
      },
    ]).catch((e) => {
      console.log(e);
    });
  };

  setSizeConfig = async () => {
    return this.renderAppView([
      {
        title: '尺寸设置',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/SCALE.png',
            type: 'input',
            title: '小组件缩放比例',
            desc: '',
            placeholder: '1',
            val: 'SCALE',
          },
        ],
      },
      {
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/ringStackSize.png',
            type: 'input',
            title: '圆环大小',
            placeholder: '65',
            desc: '',
            val: 'ringStackSize',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/ringTextSize.png',
            type: 'input',
            title: '圆环中心文字大小',
            placeholder: '14',
            desc: '',
            val: 'ringTextSize',
          },
        ],
      },
      {
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/feeTextSize.png',
            type: 'input',
            title: '话费文字大小',
            placeholder: '21',
            desc: '',
            val: 'feeTextSize',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/textSize.png',
            type: 'input',
            title: '文字模式下文字大小',
            placeholder: '13',
            desc: '',
            val: 'textSize',
          },
        ],
      },
      {
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallPadding.png',
            type: 'input',
            title: '小尺寸组件边距',
            placeholder: '13',
            desc: '',
            val: 'smallPadding',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/padding.png',
            type: 'input',
            title: '中尺寸组件边距',
            placeholder: '10',
            desc: '',
            val: 'padding',
          },
        ],
      },
      {
        title: '重置尺寸',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/clear.png',
            title: '重置尺寸',
            desc: '重置当前尺寸配置',
            name: 'reset',
            val: 'reset',
            onClick: () => {
              const propertiesToDelete = ['SCALE', 'ringStackSize', 'ringTextSize', 'feeTextSize', 'textSize', 'smallPadding', 'padding',];
              propertiesToDelete.forEach(prop => {
                delete this.settings[prop];
              });
              this.saveSettings();
              this.reopenScript();
            },
          },
        ],
      },
    ]).catch((e) => {
      console.log(e);
    });
  };

  Run() {
    if (config.runsInApp) {
      let accountMenus = [];
      for (let i = 1; i <= 5; i++) {
        accountMenus = accountMenus.concat(this.getAccountMenu(i));
      }
      
      if (accountMenus.length > 0) {
        accountMenus[0].title = '账户设置';
      }
      
      accountMenus.push({
        title: '重置账户',
        menu: [{
          url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/clear.png',
          title: '重置账户',
          desc: '清空所有账户设置与缓存',
          name: 'reset',
          val: 'reset',
          onClick: () => {
            for (let i = 1; i <= 5; i++) {
              delete this.settings[`telecom_phone${i}`];
              delete this.settings[`telecom_password${i}`];
              delete this.settings[`telecom_deviceid${i}`];
              delete this.settings[`widgetStyle${i}`];
              delete this.settings[`telecom_token${i}`];
              delete this.settings[`telecom_cityCode${i}`];
              delete this.settings[`telecom_provinceCode${i}`];
            }
            const fm = FileManager.local();
            const cacheDir = fm.joinPath(fm.documentsDirectory(), "ChinaTelecom_Cache");
            if (fm.fileExists(cacheDir)) fm.remove(cacheDir);
            this.saveSettings();
            this.reopenScript();
          }
        }]
      });

      this.registerAction({
        title: '组件配置',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/update.png',
            type: 'input',
            title: '脚本更新',
            name: 'update',
            onClick: async () => {
              await this.checkAndUpdateScript();
            },
          },
          {
            icon: { name: 'lineweight', color: '#a0d911' },
            type: 'select',
            title: '账户预览',
            options: ['1', '2', '3', '4', '5'],
            val: 'previewAccount',
            desc: '仅在 App 内运行脚本时生效'
          }
        ],
      });
      this.registerAction({
        title: '',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/filterOrientateFlow.png',
            type: 'switch',
            title: '过滤定向',
            val: 'filterOrientateFlow',
            desc: '切换后自动刷新数据',
            onChange: async () => {
              delete this.settings.dataSource;
              delete this.settings.telecom_token;
              delete this.settings.telecom_cityCode;
              delete this.settings.telecom_provinceCode;
              this.saveSettings(false);
              await this.notify(this.name, '设置已更新，正在刷新数据...');
              this.reopenScript();
            },
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/showUsedFlow.png',
            type: 'switch',
            title: '显示已用',
            desc: '更改后请清除缓存生效',
            val: 'showUsedFlow',
            desc: '切换后自动刷新数据',
            onChange: async () => {
              delete this.settings.dataSource;
              delete this.settings.telecom_token;
              delete this.settings.telecom_cityCode;
              delete this.settings.telecom_provinceCode;
              this.saveSettings(false);
              await this.notify(this.name, '设置已更新，正在刷新数据...');
              this.reopenScript();
            },
          },
        ],
      });
      this.registerAction({
        title: '',
        menu: [
          {
            name: 'color',
            url: 'https://pic1.imgdb.cn/item/63315c1e16f2c2beb1a27363.png',
            title: '颜色配置',
            type: 'input',
            onClick: () => {
              return this.setColorConfig();
            },
          },
          {
            name: 'size',
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/size.png',
            title: '尺寸设置',
            type: 'input',
            onClick: () => {
              return this.setSizeConfig();
            },
          },
        ],
      });
      this.registerAction({
        title: '',
        menu: [
          {
            name: 'accounts',
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/enableName.png',
            title: '账户设置',
            type: 'input',
            onClick: () => {
              return this.renderAppView(accountMenus);
            },
          },
          {
            icon: { name: 'trash', color: '#ff4d4f' },
            title: '清除缓存',
            val: 'clearCache',
            onClick: async () => {
              const fm = FileManager.local();
              const cacheDir = fm.joinPath(fm.documentsDirectory(), 'ChinaTelecom_Cache');
              
              if (fm.fileExists(cacheDir)) {
                fm.remove(cacheDir);
                const alert = new Alert();
                alert.title = '清除成功';
                alert.message = '所有账户缓存已清除，脚本将自动刷新。';
                alert.addAction('确定');
                await alert.present();
                this.reopenScript();
              } else {
                const alert = new Alert();
                alert.title = '提示';
                alert.message = '缓存目录不存在，无需清除。';
                alert.addAction('确定');
                await alert.present();
              }
            },
          },
        ],
      });
      this.registerAction({
        title: '',
        menu: [
          {
            name: 'basic',
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/basic.png',
            title: '基础功能',
            type: 'input',
            onClick: () => {
              return this.setWidgetConfig();
            },
          },
          {
            name: 'reload',
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/reload.png',
            title: '重载组件',
            type: 'input',
            onClick: () => {
              this.reopenScript();
            },
          },
        ],
      });
    }
  }

  async render() {
    await this.init();
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    if (this.widgetFamily === 'medium') {
      return await this.renderMedium(widget);
    } else if (this.widgetFamily === 'large') {
      return await this.renderLarge(widget);
    } else {
      return await this.renderSmall(widget);
    }
  }
}

await Runing(Widget, args.widgetParameter, false);
