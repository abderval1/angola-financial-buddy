import { useState, useEffect, useCallback } from 'react';

// ============================================
// REAL MARKET DATA HOOK - ALL INSTRUMENTS
// ============================================

const ALPHA_VANTAGE_API_KEY = 'demo';
const TWELVEDATA_API_KEY = 'demo';
const FINNHUB_API_KEY = 'd6j2e21r01ql467i0tugd6j2e21r01ql467i0tv0';

export interface MarketQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    market: string;
    currency: string;
    timestamp: number;
    marketCap?: number;
    peRatio?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
}

export interface HistoricalData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TechnicalIndicators {
    rsi: number | null;
    macd: { value: number; signal: number; histogram: number } | null;
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    ema12: number | null;
    ema26: number | null;
    bb: { upper: number; middle: number; lower: number } | null;
    atr: number | null;
    adx: number | null;
}

export interface CryptoQuote {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    changePercent24h: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    marketCap: number;
    timestamp: number;
}

export interface ForexQuote {
    base: string;
    quote: string;
    rate: number;
    bid: number;
    ask: number;
    timestamp: number;
}

export interface MarketNews {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    publishedAt: string;
    symbols: string[];
    imageUrl?: string;
}

export interface StockSymbol {
    symbol: string;
    name: string;
    type: 'stock' | 'etf' | 'bond' | 'crypto' | 'forex';
    market: string;
    currency: string;
    country: string;
}

// ===============================
// COMPLETE GLOBAL STOCKS LIST
// ===============================
export const GLOBAL_STOCKS: StockSymbol[] = [
    // US Stocks - NASDAQ (Top 30)
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'INTC', name: 'Intel Corporation', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'CRM', name: 'Salesforce Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'ORCL', name: 'Oracle Corporation', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'ADBE', name: 'Adobe Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'PYPL', name: 'PayPal Holdings Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'CSCO', name: 'Cisco Systems Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'AVGO', name: 'Broadcom Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'COST', name: 'Costco Wholesale', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'PEP', name: 'PepsiCo Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'ABNB', name: 'Airbnb Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'UBER', name: 'Uber Technologies', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'SNOW', name: 'Snowflake Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'PANW', name: 'Palo Alto Networks', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'NOW', name: 'ServiceNow Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'SNAP', name: 'Snap Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'SHOP', name: 'Shopify Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'SQ', name: 'Block Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'TWLO', name: 'Twilio Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'ZM', name: 'Zoom Video Communications', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'DOCU', name: 'DocuSign Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'CRWD', name: 'CrowdStrike Holdings', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },

    // US Stocks - NYSE (Top 30)
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'V', name: 'Visa Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'WMT', name: 'Walmart Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'PG', name: 'Procter & Gamble Co.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'MA', name: 'Mastercard Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'UNH', name: 'UnitedHealth Group', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'HD', name: 'Home Depot Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'DIS', name: 'Walt Disney Co.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'BAC', name: 'Bank of America', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'XOM', name: 'Exxon Mobil Corp.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'KO', name: 'Coca-Cola Co.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'TMO', name: 'Thermo Fisher Scientific', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'ABBV', name: 'AbbVie Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'MRK', name: 'Merck & Co.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'LLY', name: 'Eli Lilly and Co.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'PFE', name: 'Pfizer Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'CVX', name: 'Chevron Corporation', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'ABT', name: 'Abbott Laboratories', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'NKE', name: 'Nike Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'ORLY', name: "O'Reilly Automotive", type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'ACN', name: 'Accenture plc', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'TXN', name: 'Texas Instruments', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'AVB', name: 'AvalonBay Communities', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'LIN', name: 'Linde plc', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'UPS', name: 'United Parcel Service', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'CAT', name: 'Caterpillar Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'BA', name: 'Boeing Co.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'MMM', name: '3M Company', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'IBM', name: 'IBM Corporation', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },

    // Brazilian Stocks (B3)
    { symbol: 'PETR4.SA', name: 'Petrobras', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'VALE3.SA', name: 'Vale S.A.', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'ITUB4.SA', name: 'Itaú Unibanco', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'BBDC4.SA', name: 'Bradesco', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'ABEV3.SA', name: 'Ambev', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'WEGE3.SA', name: 'WEG S.A.', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'MGLU3.SA', name: 'Magazine Luiza', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'NTCO3.SA', name: 'Natura&Co', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'B3SA3.SA', name: 'B3 S.A.', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'RENT3.SA', name: 'Localiza', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'EQTL3.SA', name: 'Equatorial Energia', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'PRIO3.SA', name: 'PetroRio', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'RAIZ4.SA', name: 'Raízen', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'SBSP3.SA', name: 'Sabesp', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'ENGI11.SA', name: 'Energisa', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },

    // UK Stocks (LSE)
    { symbol: 'BP.L', name: 'BP plc', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'HSBA.L', name: 'HSBC Holdings', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'SHEL.L', name: 'Shell plc', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'AZN.L', name: 'AstraZeneca', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'ULVR.L', name: 'Unilever', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'GSK.L', name: 'GlaxoSmithKline', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'REL.L', name: 'Relx plc', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'RIO.L', name: 'Rio Tinto', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'DGE.L', name: 'Diageo plc', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'VOD.L', name: 'Vodafone Group', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'BA.L', name: 'BAE Systems', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'BATS.L', name: 'British American Tobacco', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'NG.L', name: 'National Grid', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'LLOY.L', name: 'Lloyds Banking Group', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'BARC.L', name: 'Barclays', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },

    // European Stocks
    { symbol: 'ASML.AS', name: 'ASML Holding', type: 'stock', market: 'EURONEXT', currency: 'EUR', country: 'Netherlands' },
    { symbol: 'LVMH.PA', name: 'LVMH Moët Hennessy', type: 'stock', market: 'EURONEXT', currency: 'EUR', country: 'France' },
    { symbol: 'TOTALEnergies.FP', name: 'TotalEnergies', type: 'stock', market: 'EURONEXT', currency: 'EUR', country: 'France' },
    { symbol: 'SIE.DE', name: 'Siemens AG', type: 'stock', market: 'XETRA', currency: 'EUR', country: 'Germany' },
    { symbol: 'BAS.DE', name: 'BASF SE', type: 'stock', market: 'XETRA', currency: 'EUR', country: 'Germany' },
    { symbol: 'SAP.DE', name: 'SAP SE', type: 'stock', market: 'XETRA', currency: 'EUR', country: 'Germany' },
    { symbol: 'DTG.DE', name: 'Deutsche Telekom', type: 'stock', market: 'XETRA', currency: 'EUR', country: 'Germany' },
    { symbol: 'ALV.DE', name: 'Allianz SE', type: 'stock', market: 'XETRA', currency: 'EUR', country: 'Germany' },
    { symbol: 'BAYN.DE', name: 'Bayer AG', type: 'stock', market: 'XETRA', currency: 'EUR', country: 'Germany' },
    { symbol: 'MBG.DE', name: 'Mercedes-Benz Group', type: 'stock', market: 'XETRA', currency: 'EUR', country: 'Germany' },
    { symbol: 'NESN.SW', name: 'Nestlé S.A.', type: 'stock', market: 'SIX', currency: 'CHF', country: 'Switzerland' },
    { symbol: 'NOVN.SW', name: 'Novartis AG', type: 'stock', market: 'SIX', currency: 'CHF', country: 'Switzerland' },
    { symbol: 'ROG.SW', name: 'Roche Holding', type: 'stock', market: 'SIX', currency: 'CHF', country: 'Switzerland' },
    { symbol: 'UBSG.SW', name: 'UBS Group', type: 'stock', market: 'SIX', currency: 'CHF', country: 'Switzerland' },
    { symbol: 'ENEL.MI', name: 'Enel S.p.A.', type: 'stock', market: 'MILAN', currency: 'EUR', country: 'Italy' },
    { symbol: 'TOT.MI', name: 'TotalEnergies Italia', type: 'stock', market: 'MILAN', currency: 'EUR', country: 'Italy' },
    { symbol: 'IBE.MI', name: 'Iberdrola S.A.', type: 'stock', market: 'MILAN', currency: 'EUR', country: 'Spain' },
    { symbol: 'BBVA.MC', name: 'Banco Bilbao Vizcaya', type: 'stock', market: 'MILAN', currency: 'EUR', country: 'Spain' },
    { symbol: 'SAN.MC', name: 'Banco Santander', type: 'stock', market: 'MILAN', currency: 'EUR', country: 'Spain' },
    { symbol: 'TEF.MC', name: 'Telefónica S.A.', type: 'stock', market: 'MILAN', currency: 'EUR', country: 'Spain' },

    // South Africa Stocks (JSE)
    { symbol: 'SOL.JO', name: 'Sasol Ltd', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    { symbol: 'MTN.JO', name: 'MTN Group', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    { symbol: 'NPN.JO', name: 'Naspers Ltd', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    { symbol: 'ABG.JO', name: 'Absa Group', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    { symbol: 'SBK.JO', name: 'Standard Bank', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    { symbol: 'IMP.JO', name: 'Impala Platinum', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    { symbol: 'SHP.JO', name: 'Shoprite Holdings', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    { symbol: 'WHL.JO', name: 'Woolworths Holdings', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    { symbol: 'FGR.JO', name: 'FirstRand Ltd', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    { symbol: 'NED.JO', name: 'Nedbank Group', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },

    // China/Hong Kong Stocks
    { symbol: '9988.HK', name: 'Alibaba Group', type: 'stock', market: 'HKEX', currency: 'HKD', country: 'China' },
    { symbol: '0700.HK', name: 'Tencent Holdings', type: 'stock', market: 'HKEX', currency: 'HKD', country: 'China' },
    { symbol: '2318.HK', name: 'Ping An Insurance', type: 'stock', market: 'HKEX', currency: 'HKD', country: 'China' },
    { symbol: '0939.HK', name: 'China Construction Bank', type: 'stock', market: 'HKEX', currency: 'HKD', country: 'China' },
    { symbol: '1398.HK', name: 'Industrial and Commercial Bank of China', type: 'stock', market: 'HKEX', currency: 'HKD', country: 'China' },
    { symbol: '000001.SS', name: 'Shanghai Composite', type: 'stock', market: 'SSE', currency: 'CNY', country: 'China' },
    { symbol: '399001.SZ', name: 'Shenzhen Component', type: 'stock', market: 'SZSE', currency: 'CNY', country: 'China' },
    { symbol: 'BABA', name: 'Alibaba ADR', type: 'stock', market: 'NYSE', currency: 'USD', country: 'China' },
    { symbol: 'JD', name: 'JD.com Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'China' },
    { symbol: 'BIDU', name: 'Baidu Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'China' },

    // India Stocks
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', type: 'stock', market: 'NSE', currency: 'INR', country: 'India' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', type: 'stock', market: 'NSE', currency: 'INR', country: 'India' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd', type: 'stock', market: 'NSE', currency: 'INR', country: 'India' },
    { symbol: 'HDB', name: 'HDFC Bank', type: 'stock', market: 'NYSE', currency: 'USD', country: 'India' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', type: 'stock', market: 'NSE', currency: 'INR', country: 'India' },

    // Japan Stocks
    { symbol: '7203.T', name: 'Toyota Motor Corp', type: 'stock', market: 'TSE', currency: 'JPY', country: 'Japan' },
    { symbol: '9984.T', name: 'SoftBank Group', type: 'stock', market: 'TSE', currency: 'JPY', country: 'Japan' },
    { symbol: '6758.T', name: 'Sony Group', type: 'stock', market: 'TSE', currency: 'JPY', country: 'Japan' },
    { symbol: '9432.T', name: 'NTT Docomo', type: 'stock', market: 'TSE', currency: 'JPY', country: 'Japan' },
    { symbol: '7974.T', name: 'Nintendo Co.', type: 'stock', market: 'TSE', currency: 'JPY', country: 'Japan' },
    { symbol: '6861.T', name: 'Keyence Corporation', type: 'stock', market: 'TSE', currency: 'JPY', country: 'Japan' },
    { symbol: '4568.T', name: 'Daiwa Securities Group', type: 'stock', market: 'TSE', currency: 'JPY', country: 'Japan' },
    { symbol: '8306.T', name: 'Mitsubishi UFJ Financial', type: 'stock', market: 'TSE', currency: 'JPY', country: 'Japan' },

    // Australia Stocks
    { symbol: 'BHP.AX', name: 'BHP Group', type: 'stock', market: 'ASX', currency: 'AUD', country: 'Australia' },
    { symbol: 'CBA.AX', name: 'Commonwealth Bank', type: 'stock', market: 'ASX', currency: 'AUD', country: 'Australia' },
    { symbol: 'WES.AX', name: 'Wesfarmers Ltd', type: 'stock', market: 'ASX', currency: 'AUD', country: 'Australia' },
    { symbol: 'CSL.AX', name: 'CSL Limited', type: 'stock', market: 'ASX', currency: 'AUD', country: 'Australia' },
    { symbol: 'NAB.AX', name: 'National Australia Bank', type: 'stock', market: 'ASX', currency: 'AUD', country: 'Australia' },
    { symbol: 'ANZ.AX', name: 'ANZ Banking Group', type: 'stock', market: 'ASX', currency: 'AUD', country: 'Australia' },
    { symbol: 'TLS.AX', name: 'Telstra Corporation', type: 'stock', market: 'ASX', currency: 'AUD', country: 'Australia' },
    { symbol: 'WOW.AX', name: 'Woolworths Group', type: 'stock', market: 'ASX', currency: 'AUD', country: 'Australia' },

    // Canada Stocks
    { symbol: 'RY.TO', name: 'Royal Bank of Canada', type: 'stock', market: 'TSX', currency: 'CAD', country: 'Canada' },
    { symbol: 'TD.TO', name: 'TD Bank', type: 'stock', market: 'TSX', currency: 'CAD', country: 'Canada' },
    { symbol: 'ENB.TO', name: 'Enbridge Inc.', type: 'stock', market: 'TSX', currency: 'CAD', country: 'Canada' },
    { symbol: 'CNR.TO', name: 'Canadian National Railway', type: 'stock', market: 'TSX', currency: 'CAD', country: 'Canada' },
    { symbol: 'SU.TO', name: 'Suncor Energy', type: 'stock', market: 'TSX', currency: 'CAD', country: 'Canada' },
    { symbol: 'MFC.TO', name: 'Manulife Financial', type: 'stock', market: 'TSX', currency: 'CAD', country: 'Canada' },
    { symbol: 'BMO.TO', name: 'Bank of Montreal', type: 'stock', market: 'TSX', currency: 'CAD', country: 'Canada' },
    { symbol: 'GIB.A', name: 'CGI Inc.', type: 'stock', market: 'TSX', currency: 'CAD', country: 'Canada' },

    // Popular ETFs
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'BND', name: 'Vanguard Total Bond Market', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'EFA', name: 'iShares MSCI EAFE ETF', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'EEM', name: 'iShares MSCI Emerging Markets', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond', type: 'etf', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'XLF', name: 'Financial Select Sector SPDR', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'XLE', name: 'Energy Select Sector SPDR', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'XLK', name: 'Technology Select Sector SPDR', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'XLV', name: 'Health Care Select Sector SPDR', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'ARKK', name: 'ARK Innovation ETF', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'JEPI', name: 'JPMorgan Equity Premium Income', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'VT', name: 'Vanguard Total World Stock ETF', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'IVV', name: 'iShares Core S&P 500 ETF', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
];

// ===============================
// CRYPTO SYMBOLS (Binance)
// ===============================
export const CRYPTO_SYMBOLS: StockSymbol[] = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'BNBUSDT', name: 'BNB', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'XRPUSDT', name: 'XRP', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'ADAUSDT', name: 'Cardano', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'DOGEUSDT', name: 'Dogecoin', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'DOTUSDT', name: 'Polkadot', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'MATICUSDT', name: 'Polygon', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'LTCUSDT', name: 'Litecoin', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'AVAXUSDT', name: 'Avalanche', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'LINKUSDT', name: 'Chainlink', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'ATOMUSDT', name: 'Cosmos', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'UNIUSDT', name: 'Uniswap', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'ETCUSDT', name: 'Ethereum Classic', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'XLMUSDT', name: 'Stellar', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'NEARUSDT', name: 'NEAR Protocol', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'APTUSDT', name: 'Aptos', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'ARBUSDT', name: 'Arbitrum', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
    { symbol: 'OPUSDT', name: 'Optimism', type: 'crypto', market: 'BINANCE', currency: 'USDT', country: 'Global' },
];

// ===============================
// FOREX SYMBOLS (TwelveData)
// ===============================
export const FOREX_SYMBOLS: StockSymbol[] = [
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', type: 'forex', market: 'FOREX', currency: 'USD', country: 'Global' },
    { symbol: 'GBP/USD', name: 'British Pound / US Dollar', type: 'forex', market: 'FOREX', currency: 'USD', country: 'Global' },
    { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', type: 'forex', market: 'FOREX', currency: 'JPY', country: 'Global' },
    { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', type: 'forex', market: 'FOREX', currency: 'CHF', country: 'Global' },
    { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', type: 'forex', market: 'FOREX', currency: 'USD', country: 'Global' },
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', type: 'forex', market: 'FOREX', currency: 'CAD', country: 'Global' },
    { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', type: 'forex', market: 'FOREX', currency: 'USD', country: 'Global' },
    { symbol: 'EUR/GBP', name: 'Euro / British Pound', type: 'forex', market: 'FOREX', currency: 'GBP', country: 'Global' },
    { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', type: 'forex', market: 'FOREX', currency: 'JPY', country: 'Global' },
    { symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', type: 'forex', market: 'FOREX', currency: 'JPY', country: 'Global' },
    { symbol: 'USD/ZAR', name: 'US Dollar / South African Rand', type: 'forex', market: 'FOREX', currency: 'ZAR', country: 'Global' },
    { symbol: 'USD/AOA', name: 'US Dollar / Angolan Kwanza', type: 'forex', market: 'FOREX', currency: 'AOA', country: 'Angola' },
    { symbol: 'EUR/AOA', name: 'Euro / Angolan Kwanza', type: 'forex', market: 'FOREX', currency: 'AOA', country: 'Angola' },
    { symbol: 'GBP/AOA', name: 'British Pound / Angolan Kwanza', type: 'forex', market: 'FOREX', currency: 'AOA', country: 'Angola' },
    { symbol: 'BRL/AOA', name: 'Brazilian Real / Angolan Kwanza', type: 'forex', market: 'FOREX', currency: 'AOA', country: 'Angola' },
    { symbol: 'EUR/BRL', name: 'Euro / Brazilian Real', type: 'forex', market: 'FOREX', currency: 'BRL', country: 'Global' },
    { symbol: 'GBP/BRL', name: 'British Pound / Brazilian Real', type: 'forex', market: 'FOREX', currency: 'BRL', country: 'Global' },
    { symbol: 'USD/MZN', name: 'US Dollar / Mozambican Metical', type: 'forex', market: 'FOREX', currency: 'MZN', country: 'Mozambique' },
    { symbol: 'EUR/ZMW', name: 'Euro / Zambian Kwacha', type: 'forex', market: 'FOREX', currency: 'ZMW', country: 'Zambia' },
    { symbol: 'USD/NAD', name: 'US Dollar / Namibian Dollar', type: 'forex', market: 'FOREX', currency: 'NAD', country: 'Namibia' },
];

export const ALL_MARKET_SYMBOLS = [...GLOBAL_STOCKS, ...CRYPTO_SYMBOLS, ...FOREX_SYMBOLS];

// ======================
// YAHOO FINANCE - Prices
// ======================
const fetchYahooQuote = async (symbol: string): Promise<MarketQuote | null> => {
    try {
        const response = await fetch(
            `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (response.ok) {
            const data = await response.json();
            if (data.quoteResponse?.result?.[0]) {
                const q = data.quoteResponse.result[0];
                return {
                    symbol: q.symbol,
                    name: q.shortName || q.longName || q.symbol,
                    price: q.regularMarketPrice || 0,
                    change: q.regularMarketChange || 0,
                    changePercent: q.regularMarketChangePercent || 0,
                    volume: q.regularMarketVolume || 0,
                    high: q.regularMarketDayHigh || 0,
                    low: q.regularMarketDayLow || 0,
                    open: q.regularMarketOpen || 0,
                    previousClose: q.regularMarketPreviousClose || 0,
                    market: q.exchange || 'NASDAQ',
                    currency: q.currency || 'USD',
                    timestamp: Date.now(),
                    marketCap: q.marketCap,
                    peRatio: q.trailingPE,
                    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
                    fiftyTwoWeekLow: q.fiftyTwoWeekLow,
                };
            }
        }
    } catch (err) {
        console.error(`Yahoo fetch error for ${symbol}:`, err);
    }
    return null;
};

// ======================
// YAHOO FINANCE - History
// ======================
const fetchYahooHistory = async (symbol: string, range: string = '1mo'): Promise<HistoricalData[]> => {
    try {
        const interval = range === '1d' ? '5m' : '1d';
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
        );

        if (response.ok) {
            const data = await response.json();
            if (data.chart?.result?.[0]) {
                const result = data.chart.result[0];
                const timestamps = result.timestamp || [];
                const indicators = result.indicators?.quote?.[0] || {};

                return timestamps.map((ts: number, i: number) => ({
                    date: new Date(ts * 1000).toISOString().split('T')[0],
                    open: indicators.open?.[i] || 0,
                    high: indicators.high?.[i] || 0,
                    low: indicators.low?.[i] || 0,
                    close: indicators.close?.[i] || 0,
                    volume: indicators.volume?.[i] || 0,
                }));
            }
        }
    } catch (err) {
        console.error(`Yahoo history fetch error for ${symbol}:`, err);
    }
    return [];
};

// ======================
// BINANCE - Crypto Prices
// ======================
const fetchBinancePrice = async (symbol: string): Promise<CryptoQuote | null> => {
    try {
        const response = await fetch(
            `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
        );

        if (response.ok) {
            const data = await response.json();
            return {
                symbol: data.symbol,
                name: symbol.replace('USDT', ''),
                price: parseFloat(data.lastPrice),
                change24h: parseFloat(data.priceChange),
                changePercent24h: parseFloat(data.priceChangePercent),
                high24h: parseFloat(data.highPrice),
                low24h: parseFloat(data.lowPrice),
                volume24h: parseFloat(data.volume),
                marketCap: 0,
                timestamp: Date.now(),
            };
        }
    } catch (err) {
        console.error(`Binance fetch error for ${symbol}:`, err);
    }
    return null;
};

// ======================
// BINANCE - Crypto Klines
// ======================
const fetchBinanceKlines = async (symbol: string, interval: string = '1d', limit: number = 30): Promise<HistoricalData[]> => {
    try {
        const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
        );

        if (response.ok) {
            const data = await response.json();
            return data.map((kline: any[]) => ({
                date: new Date(kline[0]).toISOString().split('T')[0],
                open: parseFloat(kline[1]),
                high: parseFloat(kline[2]),
                low: parseFloat(kline[3]),
                close: parseFloat(kline[4]),
                volume: parseFloat(kline[5]),
            }));
        }
    } catch (err) {
        console.error(`Binance klines fetch error for ${symbol}:`, err);
    }
    return [];
};

// ======================
// TWELVEDATA - Forex
// ======================
const fetchTwelveDataForex = async (symbol: string): Promise<ForexQuote | null> => {
    try {
        const response = await fetch(
            `https://api.twelvedata.com/forex_pair?symbol=${symbol}&apikey=${TWELVEDATA_API_KEY}`
        );

        if (response.ok) {
            const data = await response.json();
            if (data.rate) {
                const parts = symbol.split('/');
                return {
                    base: parts[0],
                    quote: parts[1],
                    rate: parseFloat(data.rate),
                    bid: parseFloat(data.rate) * 0.9995,
                    ask: parseFloat(data.rate) * 1.0005,
                    timestamp: Date.now(),
                };
            }
        }
    } catch (err) {
        console.error(`TwelveData fetch error for ${symbol}:`, err);
    }
    return null;
};

// ======================
// ALPHA VANTAGE - Indicators
// ======================
const fetchAlphaVantageIndicators = async (symbol: string): Promise<TechnicalIndicators | null> => {
    try {
        const avSymbol = symbol.replace('.SA', '').replace('.L', '');

        const [rsiRes, smaRes, macdRes] = await Promise.all([
            fetch(`https://www.alphavantage.co/query?function=RSI&symbol=${avSymbol}&interval=daily&time_period=14&apikey=${ALPHA_VANTAGE_API_KEY}`),
            fetch(`https://www.alphavantage.co/query?function=SMA&symbol=${avSymbol}&interval=daily&time_period=20&apikey=${ALPHA_VANTAGE_API_KEY}`),
            fetch(`https://www.alphavantage.co/query?function=MACD&symbol=${avSymbol}&interval=daily&apikey=${ALPHA_VANTAGE_API_KEY}`),
        ]);

        const rsiData = await rsiRes.json();
        const smaData = await smaRes.json();
        const macdData = await macdRes.json();

        const indicators: TechnicalIndicators = {
            rsi: rsiData?.['Technical Analysis: RSI'] ?
                parseFloat(Object.values(rsiData['Technical Analysis: RSI'])[0] as string) : null,
            sma20: smaData?.['Technical Analysis: SMA'] ?
                parseFloat(Object.values(smaData['Technical Analysis: SMA'])[0] as string) : null,
            sma50: null,
            sma200: null,
            macd: macdData?.['Technical Analysis: MACD'] ?
                (() => {
                    const latest = Object.values(macdData['Technical Analysis: MACD'])[0] as any;
                    return {
                        value: parseFloat(latest['MACD'] || 0),
                        signal: parseFloat(latest['MACD_Signal'] || 0),
                        histogram: parseFloat(latest['MACD_Hist'] || 0),
                    };
                })() : null,
            ema12: null,
            ema26: null,
            bb: null,
            atr: null,
            adx: null,
        };

        return indicators;
    } catch (err) {
        console.error(`Alpha Vantage fetch error for ${symbol}:`, err);
    }
    return null;
};

// ======================
// YAHOO FINANCE - News
// ======================
const fetchYahooNews = async (symbol?: string): Promise<MarketNews[]> => {
    try {
        const url = symbol
            ? `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}&newsCount=10`
            : 'https://query1.finance.yahoo.com/v1/finance/search?q=&newsCount=15';

        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();
            if (data.news && data.news.length > 0) {
                return data.news.map((item: any, i: number) => ({
                    id: `${i}-${Date.now()}`,
                    title: item.title || '',
                    summary: item.summary || '',
                    source: item.publisher || 'Yahoo Finance',
                    url: item.link || '',
                    publishedAt: item.publishedAt || new Date().toISOString(),
                    symbols: item.relatedSymbols || [],
                    imageUrl: item.thumbnail?.imageUrl,
                }));
            }
        }
    } catch (err) {
        console.error('Yahoo news fetch error:', err);
    }
    return [];
};

// ======================
// Main Hook
// ======================
export const useRealMarketData = () => {
    const [quotes, setQuotes] = useState<Map<string, MarketQuote>>(new Map());
    const [cryptoQuotes, setCryptoQuotes] = useState<Map<string, CryptoQuote>>(new Map());
    const [forexQuotes, setForexQuotes] = useState<Map<string, ForexQuote>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchStockQuotes = useCallback(async (symbols: string[]): Promise<void> => {
        if (symbols.length === 0) return;

        setLoading(true);
        setError(null);

        const newQuotes = new Map<string, MarketQuote>();

        try {
            const symbolString = symbols.join(',');
            const response = await fetch(
                `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolString)}`,
                { headers: { 'Accept': 'application/json' } }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.quoteResponse?.result) {
                    for (const q of data.quoteResponse.result) {
                        const quote: MarketQuote = {
                            symbol: q.symbol,
                            name: q.shortName || q.longName || q.symbol,
                            price: q.regularMarketPrice || 0,
                            change: q.regularMarketChange || 0,
                            changePercent: q.regularMarketChangePercent || 0,
                            volume: q.regularMarketVolume || 0,
                            high: q.regularMarketDayHigh || 0,
                            low: q.regularMarketDayLow || 0,
                            open: q.regularMarketOpen || 0,
                            previousClose: q.regularMarketPreviousClose || 0,
                            market: q.exchange || 'NASDAQ',
                            currency: q.currency || 'USD',
                            timestamp: Date.now(),
                            marketCap: q.marketCap,
                            peRatio: q.trailingPE,
                            fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
                            fiftyTwoWeekLow: q.fiftyTwoWeekLow,
                        };
                        newQuotes.set(q.symbol, quote);
                    }
                }
            }
        } catch (err) {
            console.error('Stock quotes fetch error:', err);
            setError('Failed to fetch stock quotes');
        }

        setQuotes(newQuotes);
        setLastUpdate(new Date());
        setLoading(false);
    }, []);

    const fetchStockQuote = useCallback(async (symbol: string): Promise<MarketQuote | null> => {
        return await fetchYahooQuote(symbol);
    }, []);

    const fetchCryptoQuotes = useCallback(async (symbols: string[]): Promise<void> => {
        const newQuotes = new Map<string, CryptoQuote>();

        for (const symbol of symbols) {
            const quote = await fetchBinancePrice(symbol);
            if (quote) {
                newQuotes.set(symbol, quote);
            }
        }

        setCryptoQuotes(newQuotes);
    }, []);

    const fetchForexQuotes = useCallback(async (symbols: string[]): Promise<void> => {
        const newQuotes = new Map<string, ForexQuote>();

        for (const symbol of symbols) {
            const quote = await fetchTwelveDataForex(symbol);
            if (quote) {
                newQuotes.set(symbol, quote);
            }
        }

        setForexQuotes(newQuotes);
    }, []);

    const fetchHistoricalData = useCallback(async (
        symbol: string,
        range: string = '1mo'
    ): Promise<HistoricalData[]> => {
        if (symbol.endsWith('USDT')) {
            const interval = range === '1d' ? '1h' : '1d';
            return await fetchBinanceKlines(symbol, interval);
        }

        if (symbol.includes('/')) {
            return [];
        }

        return await fetchYahooHistory(symbol, range);
    }, []);

    const fetchTechnicalIndicators = useCallback(async (
        symbol: string
    ): Promise<TechnicalIndicators | null> => {
        return await fetchAlphaVantageIndicators(symbol);
    }, []);

    const fetchNews = useCallback(async (symbol?: string): Promise<MarketNews[]> => {
        return await fetchYahooNews(symbol);
    }, []);

    const searchSymbols = useCallback((query: string): StockSymbol[] => {
        if (!query || query.length < 1) return ALL_MARKET_SYMBOLS.slice(0, 20);

        const lowerQuery = query.toLowerCase();
        return ALL_MARKET_SYMBOLS
            .filter(s =>
                s.symbol.toLowerCase().includes(lowerQuery) ||
                s.name.toLowerCase().includes(lowerQuery) ||
                s.market.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 20);
    }, []);

    const refreshAll = useCallback(async () => {
        setLoading(true);

        const stockSymbols = GLOBAL_STOCKS.slice(0, 50).map(s => s.symbol);
        await fetchStockQuotes(stockSymbols);

        const cryptoSymbols = CRYPTO_SYMBOLS.map(s => s.symbol);
        await fetchCryptoQuotes(cryptoSymbols);

        const forexSymbols = FOREX_SYMBOLS.slice(0, 10).map(s => s.symbol);
        await fetchForexQuotes(forexSymbols);

        setLoading(false);
    }, [fetchStockQuotes, fetchCryptoQuotes, fetchForexQuotes]);

    useEffect(() => {
        refreshAll();
    }, []);

    return {
        quotes,
        cryptoQuotes,
        forexQuotes,
        loading,
        error,
        lastUpdate,
        fetchStockQuote,
        fetchStockQuotes,
        fetchCryptoQuotes,
        fetchForexQuotes,
        fetchHistoricalData,
        fetchTechnicalIndicators,
        fetchNews,
        searchSymbols,
        refreshAll,
        globalStocks: GLOBAL_STOCKS,
        cryptoSymbols: CRYPTO_SYMBOLS,
        forexSymbols: FOREX_SYMBOLS,
    };
};
