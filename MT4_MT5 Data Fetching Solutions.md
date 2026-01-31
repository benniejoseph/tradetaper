# **Comprehensive Architectural Analysis of MetaTrader 4 and 5 Data Extraction Strategies for Trading Journal Applications**

## **Executive Summary**

The development of a competitive trading journal application in the retail Forex and CFD market necessitates a robust, scalable, and cost-efficient mechanism for ingesting trade data from MetaTrader 4 (MT4) and MetaTrader 5 (MT5). These two platforms constitute the overwhelming majority of the retail trading infrastructure globally, yet they lack modern, open connectivity standards such as RESTful APIs or OAuth authentication. This "walled garden" architecture forces third-party developers to engineer complex solutions to fetch account details and trade history.

While "Terminal-as-a-Service" providers like MetaApi offer a convenient entry point, they often introduce prohibitive unit economics at scale, latency issues, and platform dependency risks that established applications (e.g., TradeZella, TraderSync, Edgewonk) avoid through alternative architectures. The user’s dissatisfaction with MetaApi is a common trajectory for growing applications that eventually hit the ceiling of SaaS-based aggregation utility costs.

This report provides an exhaustive technical and operational analysis of the alternative methodologies used by market leaders to extract data from the MetaTrader ecosystem. It dissects the architectures of "Client-Side Push" protocols (FTP), proprietary "Headless Terminal Farms" (the standard for premium sync), and "Middleware Integration" strategies. By reverse-engineering the user flows of major competitors and analyzing the underlying technical constraints of the MetaQuotes ecosystem, this document serves as a blueprint for architecting a trading journal backend that balances data fidelity, user experience, and operational sovereignty.

## ---

**1\. The MetaTrader Connectivity Paradox**

To engineer a solution that bypasses the limitations of MetaApi, one must first understand the foundational constraints of the environment. The difficulty in retrieving a simple list of historical trades is not a bug; it is a feature of the MetaTrader architecture designed to protect broker sovereignty.

### **1.1 The Legacy of the "Walled Garden"**

MetaTrader 4, released in 2005, predates the modern API economy. It was architected in an era where trading was a solitary activity conducted on a desktop executable, and data privacy meant keeping data strictly on the client’s hard drive or the broker’s server.

* **Protocol Obscurity:** The communication between the Client Terminal (terminal.exe) and the Broker Server is a proprietary, encrypted binary stream. It is not HTTP-based. There are no public endpoints to query.  
* **The Manager API Moat:** MetaQuotes provides an API for server administration, known as the **Manager API**. This C++ interface allows full access to all client data but is licensed strictly to brokerage firms. Third-party developers cannot legally or technically acquire this API without a direct partnership with a broker.1  
* **The Client as the Gateway:** Because the Server is inaccessible to the public, the **Client Terminal** becomes the only viable gateway for data extraction. Any solution that "fetches" data must effectively simulate a human user opening the terminal, authenticating, and reading the history tab.

### **1.2 The "Investor Password" Authentication Model**

A critical enabler for all third-party journals is the **Investor Password**. Every MetaTrader account has two sets of credentials:

1. **Master Password:** Grants full trading privileges (opening/closing positions).  
2. **Investor Password:** Grants read-only access.2

Successful trading journals utilize the Investor Password to ensure security. However, this password is strictly an *authentication* token for the proprietary protocol. It does not grant API access. It simply allows a standard MT4/MT5 client to log in and view data. Therefore, the core engineering challenge for a trading journal is: **How do we automate a GUI-based application to log in with an Investor Password and export data, without asking the user to do it manually?**

### **1.3 The Limitations of MetaApi**

The user’s query highlights dissatisfaction with MetaApi. While technically capable, MetaApi essentially acts as a reseller of the "Terminal Farm" architecture.

* **Cost Scaling:** MetaApi charges per account or per resource unit. For a B2C application with thousands of users (many of whom may be free-tier or low-value), the cost of maintaining thousands of cloud-hosted terminals via a third party becomes unsustainable.  
* **Black Box Risk:** Relying on a single vendor for the core value proposition (data ingestion) creates an existential risk. If the vendor alters pricing or suffers downtime, the journal application is paralyzed.  
* **Latency:** The extra "hop" through a third-party cloud adds latency, which, while acceptable for journaling, degrades the "magic" of the user experience.

The following sections detail how to replicate the functionality of MetaApi in-house or utilize alternative integration pathways that offer better unit economics.

## ---

**2\. Deconstructing Competitor Architectures**

To identify the "solution that these applications use," we must analyze the user experience and technical artifacts of market leaders like **TradeZella**, **TraderSync**, and **Edgewonk**.

### **2.1 The TradeZella "Broker Sync" Model**

TradeZella’s primary integration method, termed "Broker Sync" or "Auto Sync," requires the user to input their **Server**, **Login**, and **Password** directly into the web application.4

* **Inference:** This indicates a **Server-Side Terminal Farm** architecture. The application takes the credentials and passes them to a backend service that spins up a containerized instance of MT4/MT5.  
* **User Flow:** The user enters credentials \-\> The system shows "Syncing" \-\> Data appears.  
* **Technology:** This "magic" is achieved by maintaining a massive infrastructure of headless Windows/Linux servers running MetaTrader instances. It is the most expensive to build but offers the lowest user friction.

### **2.2 The Edgewonk & TradesViz "FTP Push" Model**

Other competitors, notably **Edgewonk** and **TradesViz**, utilize a method that relies on the user’s local machine. They instruct the user to configure the "FTP" tab in their MetaTrader terminal.6

* **Inference:** This leverages the **Client-Side Push** architecture. The application does not connect to the broker; rather, the user's terminal pushes a report to the application.  
* **User Flow:** User opens MT4 \-\> Goes to Tools/Options/FTP \-\> Enters credentials provided by the app \-\> Checks "Auto Publish".  
* **Technology:** This offloads the computational cost to the user. The backend simply runs an FTP server and a file parser.

### **2.3 The "File Upload" Fallback**

Almost all journals, including **TradeFxBook** and **TraderSync**, offer a manual file upload option. Users export their history to HTML or CSV and upload it. While not an "API," automating the parsing of these files is a critical component of the backend, serving as the ingestion engine for the FTP method as well.

## ---

**3\. Architecture A: The Client-Side Push (FTP Automation)**

The most cost-effective and universally compatible solution—and likely the one used by competitors to service their lower-tier or free users—is the **FTP Push Architecture**. This method bypasses the need for the application developer to host any trading terminals.

### **3.1 Mechanism of Action**

MetaTrader 4 and 5 terminals possess a native, often underutilized feature: the **Publisher**. This feature allows the terminal to automatically generate a Statement (in HTML or CSV format) and upload it to a specified FTP server at a regular interval (e.g., every 5 to 60 minutes).8

**The Strategic Advantage:**

* **Zero Infrastructure Cost per User:** The computational heavy lifting (connecting to the broker, downloading history, generating the report) is done by the user's computer.  
* **Infinite Scalability:** Your infrastructure only needs to handle incoming file uploads, which is trivial compared to hosting active terminal sessions.  
* **Universal Compatibility:** It works with *every* broker, as the feature is built into the generic MetaTrader client, not the broker's server side.

### **3.2 Technical Implementation Strategy**

#### **3.2.1 The FTP Server Infrastructure**

You must provision a robust FTP server architecture.

* **Isolation is Key:** Security is paramount. You cannot have users seeing each other's reports. The architecture should dynamically generate a unique FTP username and password (or a unique subdirectory with write-only permissions) for each user account in your app.  
* **Software:**  
  * **Linux:** vsftpd (Very Secure FTP Daemon) or ProFTPD configured with virtual users backed by a database (MySQL/PostgreSQL) rather than system users.  
  * **Cloud:** AWS Transfer Family (SFTP/FTP) backed by S3. This is more expensive but infinitely scalable and serverless. Files land directly in an S3 bucket, triggering a Lambda function for parsing.

#### **3.2.2 The Ingestion Pipeline**

Once the file lands on your server, an event-driven pipeline must process it.

* **File Watchers:** On a VPS, use libraries like chokidar (Node.js) or watchdog (Python) to monitor the upload directory.  
* **Debouncing:** MT4/MT5 might upload the file in chunks. The watcher must ensure the file is fully written (file lock released) before attempting to parse it to avoid "unexpected end of file" errors.  
* **Diffing:** The terminal uploads the *entire* history every time, not just new trades. Your ingestion logic must check the Ticket Number (unique ID) against your database to avoid duplicates.

#### **3.2.3 Parsing The HTML Report (The "Hard" Part)**

The standard "Statement.htm" generated by MT4 is an HTML table. It is not a structured data format like JSON. Your application needs a robust scraping engine.

* **Node.js Implementation:**  
  * **Library:** **Cheerio** is the industry standard here.9 It implements a subset of jQuery for the server. It is faster than JSDOM because it doesn't execute JavaScript; it just parses the markup.  
  * **Logic:**  
    1. Load the HTML string into Cheerio (const $ \= cheerio.load(html)).  
    2. Identify the table structure. MT4 reports typically have headers like "Closed Transactions" and "Open Trades".  
    3. Iterate through $('tr'). Use logic to detect where the "Closed Transactions" section starts.  
    4. For each row, extract $('td') elements.  
    5. **Schema Mapping:**  
       * Column 1: Ticket (Primary Key)  
       * Column 2: Open Time (Must parse datetime string "YYYY.MM.DD HH:mm")  
       * Column 3: Type (buy/sell/balance)  
       * Column 4: Size (Lots)  
       * Column 5: Item (Symbol/Pair)  
       * Column 6: Price (Open Price)  
       * ...  
       * Column 13: Profit  
* **Python Implementation:**  
  * **Library:** **BeautifulSoup 4 (bs4)** with the lxml parser is the robust choice.10  
  * **Logic:** Similar to Cheerio. soup.find\_all('tr') followed by cell extraction.

#### **3.2.4 Handling CSV/XML (MT5 Specifics)**

MT5 allows for more flexible export formats including XML and CSV.11

* **Advantage:** Parsing CSV is computationally cheaper and less prone to breakage if MetaQuotes changes the HTML styling.  
* **Automation:** Users can run a custom script (EA) that exports CSV and uses the SendFTP() MQL function.12 However, asking users to install a custom EA adds friction. Stick to the native HTML publisher for the lowest barrier to entry.

### **3.3 Strategic Assessment for "Unhappy" MetaApi Users**

* **Why this solves your problem:** It removes the reliance on a third-party API provider entirely. You own the parser. The user owns the connection.  
* **Trade-off:** The "Sync" is not instant. It depends on the user's terminal being open and the refresh rate (e.g., every 60 mins). This is acceptable for a journal (post-trade analysis) but not for real-time alerting.

## ---

**4\. Architecture B: The Proprietary "Terminal Farm" (The TradeZella Method)**

If the goal is to replicate the "Magic Sync" experience of TradeZella—where the user enters credentials and the system fetches data without the user keeping their computer on—you must build what MetaApi built: a **Headless Terminal Farm**.

This is the "Gold Standard" for trading journals. It allows for on-demand syncing, better data fidelity, and lower user friction.

### **4.1 The Infrastructure Stack: Linux, Wine, and Docker**

MetaTrader is a Windows application. Hosting thousands of Windows Server instances is cost-prohibitive due to licensing and resource overhead. The industry standard solution is running MT4/MT5 on **Linux** using **WINE**.

#### **4.1.1 The Container Strategy (Docker)**

You must containerize the application to ensure isolation. If one terminal crashes, it shouldn't take down the whole server.

* **Base Image:** A lightweight Linux distro like debian:bullseye-slim or alpine (though Alpine's musl libc can have compatibility issues with WINE, so Debian is safer).  
* **WINE Prefix:** Each container has its own WINEPREFIX (virtual C: drive).  
* **Xvfb (X Virtual Framebuffer):** Since these are headless cloud servers (no monitors), Xvfb creates a virtual display that MT4 "draws" to. Without this, the GUI application will fail to launch.  
* **VNC (Optional):** For debugging, you might include a VNC server (like x11vnc) to visually inspect what the terminal is doing during development.13

#### **4.1.2 Optimization for Scale**

* **Resource Footprint:** A stripped-down MT4 instance on WINE can run on \~100MB \- 200MB of RAM. A 32GB RAM server can theoretically host 100+ concurrent instances.  
* **Orchestration:** Use **Kubernetes (K8s)** or **Docker Swarm**.  
  * **On-Demand Pods:** When a user clicks "Sync," K8s spins up a pod.  
  * **Persistent vs. Ephemeral:**  
    * *Ephemeral:* Spin up, login, fetch history, destroy. (Cheaper, but login takes time).  
    * *Persistent:* Keep the terminal running 24/7. (Instant updates, but expensive). Most journals use Ephemeral or "Warm Pool" strategies.

### **4.2 The "Bridge" Technology: Communication Protocols**

Once the terminal is running in a container, how does your Node.js/Python backend talk to it to request trade history? You cannot use CLI commands. You need a communication bridge.

#### **4.2.1 The ZeroMQ (ZMQ) Approach**

This is the most popular "Grey Hat" method used by sophisticated dev teams.

1. **The MQL Side (Server):** You write a custom Expert Advisor (EA) in MQL4/5.  
   * This EA imports a DLL (like libzmq.dll) to enable socket communication.  
   * It binds a TCP port (e.g., 5555).  
   * It listens for JSON commands: {"action": "GET\_HISTORY", "from": "2023.01.01"}.  
   * It uses native MQL functions (OrdersHistoryTotal, OrderSelect) to fetch data, serializes it to JSON, and sends it back.  
2. **The Application Side (Client):** Your backend connects to tcp://container\_ip:5555 via a ZMQ library.

**Advantages:** Extremely fast (millisecond latency). Full control over the logic.

**Disadvantages:** Requires Allow DLL Imports to be enabled in the terminal, which can be flagged by some security settings (though on your own server, you control this).

#### **4.2.2 The File-Based Exchange (The "Shared Volume" Approach)**

A simpler, lower-tech alternative to ZMQ avoids networking complexity.

1. **Docker Volume:** Mount a shared directory between the Host (Linux) and the Container (WINE).  
2. **Command:** The backend writes a command.txt file to this folder.  
3. **EA Loop:** The EA running in the terminal monitors this folder (using OnTimer every 1 second).  
4. **Execution:** When command.txt appears, the EA reads it, fetches history, writes history.json to the folder, and deletes command.txt.  
5. **Ingestion:** The backend reads history.json.

**Advantages:** robust, no DLLs required (standard file I/O is native to MQL), easier to debug.

**Disadvantages:** Slower (file I/O latency), harder to handle high concurrency.

### **4.3 Managing Broker Configurations (.srv Files)**

A critical hurdle in the Farm approach is the **Broker Server configuration**.

* When you install MT4 from "Broker A," it comes with BrokerA.srv files. It knows how to connect to Broker A.  
* If your user uses "Broker B," your generic MT4 terminal won't know the IP address of Broker B's server.  
* **Solution:** You must build a library of .srv files.  
  * *Sourcing:* You can scrape these from many installations or find repositories online.  
  * *Placement:* Your script must dynamically inject the correct .srv file into the config/ folder of the MT4 instance before launching it.14  
  * *Discovery:* Use the loader.exe or equivalent to query the broker's DNS for fresh server IPs.

## ---

**5\. Architecture C: Middleware Integration (The Fixed-Cost License)**

If building a Terminal Farm from scratch (Architecture B) is too engineering-heavy, but MetaApi is too expensive, the **Middleware License** model is the strategic middle ground.

### **5.1 The Value Proposition: Buy the Tech, Own the Infra**

Companies like **mtapi.online** (not to be confused with MetaApi) and **MTsocketAPI** sell the *software* that powers a terminal farm, rather than the service itself.15

* **MetaApi Model:** You pay rent. (SaaS)  
* **Middleware Model:** You buy the house. (On-Premise Software)

### **5.2 Provider Analysis**

#### **5.2.1 MTsocketAPI**

This provider offers an EA-based solution that creates a socket server, similar to the custom ZMQ approach described in 4.2.1, but pre-packaged and supported.

* **Licensing:** They offer "Unlimited" licenses or fixed monthly fees (e.g., \~€400/month for unlimited connections).17  
* **Architecture:** You install their EA on your terminals. They provide client libraries (Python, Node.js) to interact with it.  
* **Benefit:** Reduces development time to zero. You just manage the Docker containers; they handle the MQL/Socket communication logic.

#### **5.2.2 mtapi.online / mtapi.io**

This provider offers a suite of tools including an "On-Premise" version of their API.16

* **Offer:** You can purchase the binary for a one-time fee (e.g., $4,000) or a fixed subscription.  
* **Deployment:** You deploy their Windows Service or Docker container on your own AWS/Azure infrastructure.  
* **Economics:** For a journal with 5,000 users, paying a fixed $500/month for software \+ $200/month for servers is drastically cheaper than paying MetaApi $0.05 per account per month ($250/month) *only if* the user count scales up. The breakeven point is key.

### **5.3 Implementation Workflow**

1. **Purchase License:** Acquire the "Manager" or "Client" API binaries.  
2. **Provision Server:** Setup a high-RAM VPS.  
3. **Install Service:** Run the middleware service.  
4. **Connect Backend:** Point your Node.js application to the middleware's local API endpoint (e.g., http://localhost:8080/Connect).  
5. **Scale:** As load increases, just add more RAM or more servers. No per-user variable costs.

## ---

**6\. Architecture D: The Aggregator "Piggyback" (Copy Trading APIs)**

A lateral thinking approach involves utilizing APIs from industries adjacent to journaling, specifically **Copy Trading**.

### **6.1 The Logic**

Platforms like **Duplikium** and **Social Trader Tools** exist to replicate trades. To do this, they have already built the massive terminal farms and solved the connectivity issues.

* **The Opportunity:** These platforms often offer APIs for "Signal Providers" or "White Labels" to manage accounts and fetch trade history.19  
* **The Hack:** You treat your journaling app as a "Signal Provider" platform. When a user connects their account, you add it as a "Slave" account in the Copy Trading system via their API.  
* **Data Fetching:** You periodically query their API endpoint (e.g., GET /accounts/{id}/orders) to retrieve the history.

### **6.2 Provider APIs**

* **Social Trader Tools:** Offers a robust API for white labels. You can manage unlimited accounts. Their architecture is cloud-native (no VPS needed).  
* **Duplikium:** Provides a "Trade Copier API." They specifically mention access to "orders, positions, and trade history".19  
  * **Cost:** Often priced per "slot" (e.g., 50 accounts). Bulk discounts apply.  
  * **Pros:** They handle the .srv updates, the specific broker quirks, and the connection stability.  
  * **Cons:** You introduce a dependency. If they go down, you go down. You are reselling their infrastructure.

## ---

**7\. Data Ingestion & Normalization Strategy**

Regardless of whether you use FTP, a custom Farm, or Middleware, the data retrieved from MT4/MT5 is raw and often messy. A robust journal requires a sophisticated normalization layer.

### **7.1 The "Ticket" Continuity Problem**

* **Issue:** In MT4, a trade has a single ticket. In MT5, a "Position" is the result of multiple "Deals" and "Orders."  
* **Normalization:** Your database schema must abstract this.  
  * **Trade Object:** Should define a trade as "Entry to Exit".  
  * **MT5 Grouping:** You must query HistoryDeals and group them by PositionID to calculate the aggregate entry price and exit price for a single "trade".11

### **7.2 Handling "Special" Transactions**

MT4/MT5 history includes non-trade rows:

* **Balance:** Deposits/Withdrawals.  
* **Credit:** Broker bonuses.  
* **Commission:** Often charged as a separate transaction or included in the swap.  
* **Strategy:** Your parser must filter rows based on Type.  
  * Type 0 (Buy) / Type 1 (Sell) \-\> **Trade**.  
  * Type 6 (Balance) \-\> **Cash Flow**.  
  * Do not sum "Credit" into "Profit" unless you want to distort the user's performance metrics.

### **7.3 Timezone Standardization**

This is the single biggest headache in Forex data.

* **The Problem:** MT4/MT5 servers run on "Broker Time," usually GMT+2 or GMT+3 (to align with NY close). The history data does not include a timezone offset. It just says "12:00".  
* **The Solution:**  
  * **Heuristic:** Compare the current "Server Time" (available in live connection) with UTC. Store this offset for that specific broker.  
  * **User Input:** Ask the user "What is your broker's timezone?" during setup.  
  * **Storage:** Always convert to UTC before saving to your database.

## ---

**8\. Comparative Analysis and Recommendation**

### **8.1 Cost vs. Complexity Matrix**

| Architecture | Setup Complexity | Maintenance | Variable Cost (per user) | Fixed Cost | Latency |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **A. FTP Push** | Low | Low | $0.00 | Low (Web Server) | High (60 min) |
| **B. Terminal Farm (Custom)** | Very High | High | Low (Server RAM) | High (Dev Time) | Low (Real-time) |
| **C. Middleware (On-Prem)** | Medium | Medium | Low (Server RAM) | Medium (License) | Low (Real-time) |
| **D. Aggregator API** | Low | Low | High (Reseller Fee) | Low | Low (Real-time) |

### **8.2 Final Recommendation for the "Unhappy" Developer**

Since you are unhappy with MetaApi likely due to cost or lack of control, but "TradeZella" uses a seamless sync, the optimal path forward is a **Hybrid Strategy**:

1. **Phase 1 (Immediate/MVP): Implement Architecture A (FTP Push).**  
   * It effectively costs nothing.  
   * It covers 100% of brokers.  
   * It is reliable.  
   * **Action:** Build a Node.js FTP listener and a Cheerio-based parser. Write a great "How-To" guide for your users.  
2. **Phase 2 (Growth): Implement Architecture C (Middleware).**  
   * Instead of building the nightmare that is a custom Terminal Farm (Architecture B), license the technology from **mtapi.online** or **MTsocketAPI**.  
   * Host it on your own servers. This gives you the "Fixed Cost" economics of owning the farm without the R\&D risk of building the bridge.  
   * Offer this as a "Premium" sync option for paid users, while keeping Free users on FTP.

By owning the middleware (Solution C) or leveraging the user's hardware (Solution A), you escape the per-account taxation of MetaApi and build a sustainable, profitable backend for your trading journal.

### **8.3 Implementation Roadmap**

**Step 1: The Parser (Week 1-2)**

* Write a robust library in your language of choice (Python/Node) that accepts an MT4 HTML file and an MT5 CSV file and outputs a standardized JSON Trade object.  
* Test this against reports from 10 major brokers (ICMarkets, Oanda, FTMO, etc.) to handle formatting quirks.

**Step 2: The FTP Receiver (Week 3\)**

* Set up a secure FTP server (e.g., AWS Transfer or vsftpd).  
* Create the file-watcher logic to trigger the Parser from Step 1\.

**Step 3: The Premium Sync (Month 2+)**

* Evaluate MTsocketAPI vs mtapi.online.  
* Spin up a test Windows VPS.  
* Deploy the middleware and verify you can fetch history programmatically.  
* Build the frontend "Connect Broker" form to accept credentials and pass them to your middleware.

This stepwise approach minimizes initial cash burn while building the foundation for a scalable, enterprise-grade application.

#### **Works cited**

1. Digest: API for multi-asset brokers \- Brokeree Solutions, accessed January 27, 2026, [https://brokeree.com/articles/digest-api-for-multi-asset-brokers/](https://brokeree.com/articles/digest-api-for-multi-asset-brokers/)  
2. How can I create an 'Investor Password' on the MT4? \- CFDs on FX, Stocks & More, accessed January 27, 2026, [https://windsorbrokers.com/knowledge-base/trading-platform/how-can-i-create-an-investor-password-on-the-mt4/](https://windsorbrokers.com/knowledge-base/trading-platform/how-can-i-create-an-investor-password-on-the-mt4/)  
3. What is an Investor Password? \- Axi Support (Int), accessed January 27, 2026, [https://support.axi.com/hc/en-us/articles/37778944147737-What-is-an-Investor-Password](https://support.axi.com/hc/en-us/articles/37778944147737-What-is-an-Investor-Password)  
4. How to Use MetaTrader 5 with Tradezella, accessed January 27, 2026, [https://www.tradezella.com/integrations/metatrader-5](https://www.tradezella.com/integrations/metatrader-5)  
5. How to Use MetaTrader 4 with Tradezella, accessed January 27, 2026, [https://www.tradezella.com/integrations/metatrader-4](https://www.tradezella.com/integrations/metatrader-4)  
6. MetaTrader 4 / Metatrader 5 Auto Sync (MT4 / MT5) \- Edgewonk \- Zendesk, accessed January 27, 2026, [https://edgewonk.zendesk.com/hc/en-us/articles/13221355121810-MetaTrader-4-Metatrader-5-Auto-Sync-MT4-MT5](https://edgewonk.zendesk.com/hc/en-us/articles/13221355121810-MetaTrader-4-Metatrader-5-Auto-Sync-MT4-MT5)  
7. Auto import trades from MetaTrader 4 and 5 \- TradesViz Blog, accessed January 27, 2026, [https://www.tradesviz.com/blog/auto-import-metatrader-ftp/](https://www.tradesviz.com/blog/auto-import-metatrader-ftp/)  
8. MetaTrader 4 Auto Import Instructions (MT4) \- UltraTrader | Blog, accessed January 27, 2026, [https://blog.ultratrader.app/metatrader-api-auto-import-instructions-mt5-mt4/](https://blog.ultratrader.app/metatrader-api-auto-import-instructions-mt5-mt4/)  
9. Web Scraping and Parsing HTML with Node.js and Cheerio | Twilio, accessed January 27, 2026, [https://www.twilio.com/en-us/blog/developers/tutorials/building-blocks/web-scraping-and-parsing-html-with-node-js-and-cheerio](https://www.twilio.com/en-us/blog/developers/tutorials/building-blocks/web-scraping-and-parsing-html-with-node-js-and-cheerio)  
10. Useful Python Packages For Parsing HTML Report \- Dojo Five, accessed January 27, 2026, [https://dojofive.com/blog/useful-python-packages-for-parsing-html-report/](https://dojofive.com/blog/useful-python-packages-for-parsing-html-report/)  
11. How to Export Data from MetaTrader 4 and 5? \- Defcofx, accessed January 27, 2026, [https://www.defcofx.com/how-to-export-data-from-metatrader-4-and-5/](https://www.defcofx.com/how-to-export-data-from-metatrader-4-and-5/)  
12. SendFTP \- Common Functions \- MQL4 Reference, accessed January 27, 2026, [https://docs.mql4.com/common/sendftp](https://docs.mql4.com/common/sendftp)  
13. Turn MetaTrader 5 into a REST API \- MT5 Quant Server with Python Tutorial Series \- Part 02, accessed January 27, 2026, [https://www.youtube.com/watch?v=SUzvM7g6Z6k](https://www.youtube.com/watch?v=SUzvM7g6Z6k)  
14. Swagger UI \- mtapi.io, accessed January 27, 2026, [https://mt4.mtapi.io/index.html](https://mt4.mtapi.io/index.html)  
15. MTsocketAPI: Low Latency Metatrader API, accessed January 27, 2026, [https://www.mtsocketapi.com/](https://www.mtsocketapi.com/)  
16. Shop \- NET MetaTrader API, accessed January 27, 2026, [https://mtapi.online/shop/](https://mtapi.online/shop/)  
17. Pricing Yearly \- MTsocketAPI, accessed January 27, 2026, [https://www.mtsocketapi.com/pricing.html](https://www.mtsocketapi.com/pricing.html)  
18. MT4+MT5 API On-Premise \- mtapi.io, accessed January 27, 2026, [https://mtapi.io/product/mt4mt5-api-on-premise/](https://mtapi.io/product/mt4mt5-api-on-premise/)  
19. Trade Copier API \- Duplikium, accessed January 27, 2026, [https://www.trade-copier.com/features/trade-copier-api](https://www.trade-copier.com/features/trade-copier-api)