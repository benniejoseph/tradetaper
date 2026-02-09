# MT5 Auto-Sync Guide (Detailed)

This guide covers two paths:

1) **Automatic Sync (Server-Side Terminal)** – minimal user work  
2) **Manual EA Sync (User-Side Terminal)** – existing fallback option

Use whichever fits the user’s broker and comfort level.

---

## Path 1: Automatic Sync (Server-Side Terminal)

**Best for:** Users who want zero MT5 setup on their side.

### What the user does
1) **Open TradeTaper → MT5 Accounts → Add Account**
2) **Enter broker credentials**
   - **Server** (exact broker server name)
   - **Login**
   - **Investor Password** (read-only password)
3) **Click “Enable Auto-Sync”**
4) **Wait for status to change to RUNNING**
5) **Trades appear automatically**

### What happens behind the scenes
- TradeTaper spins up a server-side MT5 terminal instance.
- The terminal logs in and streams trades to the backend.
- No EA install required by the user.

### Troubleshooting (user-facing)
- **Status stuck at STARTING** → Broker server name might be wrong.
- **No trades after RUNNING** → Wait 1–2 minutes for first sync.
- **Auth error** → Confirm investor password (not master password).

---

## Path 2: Manual EA Sync (User-Side Terminal)

**Best for:** Users who cannot use server-side terminals or want local control.

### Step-by-step (very detailed)

#### Step 1: Install the TradeTaper EA
1) Open **MetaTrader 5**
2) Press **F4** to open **MetaEditor**
3) In the left sidebar, expand **Experts**
4) Copy `TradeTaperSync.mq5` into the **Experts** folder
5) In MetaEditor, open `TradeTaperSync.mq5`
6) Click **Compile** (top toolbar)

#### Step 2: Allow WebRequest URLs (MT5 required)
1) In MT5, go to **Tools → Options → Expert Advisors**
2) Check **“Allow WebRequest for listed URL”**
3) Add your TradeTaper API URL:
   - `https://api.tradetaper.com`
4) Click **OK**

#### Step 3: Attach the EA to a chart
1) Open any chart (e.g., EURUSD, M1)
2) In the **Navigator** panel, find **Expert Advisors**
3) Drag **TradeTaperSync** onto the chart

#### Step 4: Configure EA inputs
When the EA settings popup appears:
- **APIEndpoint** → `https://api.tradetaper.com`
- **TerminalId** → Provided in TradeTaper UI
- **AuthToken** → Provided in TradeTaper UI (preferred)
- (Optional) **APIKey** → legacy fallback
- **HeartbeatInterval** → keep default
- **SyncInterval** → keep default

Click **OK**

#### Step 5: Enable Algo Trading
1) Click **Algo Trading** on the MT5 toolbar
2) Ensure the button is **green** (enabled)

#### Step 6: Verify sync
1) EA will send heartbeat in ~30 seconds
2) Trades should appear in TradeTaper within 1–2 minutes

### Common errors and fixes
- **“Error: TerminalId is required”**  
  → Add TerminalId in EA inputs.
- **WebRequest error**  
  → Add API URL to Expert Advisors allowed list.
- **No trades syncing**  
  → Ensure MT5 is connected to broker and Algo Trading is enabled.

---

## Where to find TerminalId + AuthToken in TradeTaper
- **MT5 Accounts → [Select account] → Terminal Token**
- Copy **TerminalId** and **AuthToken** values

---

# Option B (Managed Terminal Provider)

**Summary:** TradeTaper integrates with a third-party terminal farm provider so the user gets fully automatic sync without installing MT5 or the EA.

### What the user sees
1) Enter broker server + login + investor password
2) Click “Connect”
3) Trades sync automatically

### What the platform needs (for you)
- Vendor account + API access
- Secure storage for broker credentials
- Sync scheduler + webhook receiver

### Typical providers
- **MetaApi** (fully managed, per-account pricing)
- **MTsocketAPI / MTAPI On-Prem** (licensed software, you host)
- **Other terminal-farm middleware** (varies by cost and control)

### Pros
- Fully automatic for the user
- Faster onboarding (no EA install)
- Consistent sync experience

### Cons
- Ongoing vendor cost (per account or per terminal)
- Vendor dependency / potential lock-in
- Data residency and compliance considerations

### Recommended use
Offer this as a **Premium Auto-Sync** option, while keeping the EA flow as fallback.

---

## Support Checklist (Internal)
- Validate broker server string format
- Confirm investor password works in read-only login
- Ensure terminal provisioning status transitions: PENDING → STARTING → RUNNING
- If EA sync used, verify allowed WebRequest URL is set in MT5

