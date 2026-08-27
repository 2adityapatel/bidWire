import { Lock, Radio, Database } from 'lucide-react';

export const WalkthroughSection = () => {
  return (
    <section id="how-it-works" className="section">
      <div className="container">
        <div className="section-header">
          <div className="section-number">04 / TECHNICAL WALKTHROUGH</div>
          <h2 className="section-title">Step-by-Step Execution Flow</h2>
          <p className="section-desc">
            An end-to-end breakdown of bid concurrency validation, PostgreSQL row locking, and cross-instance Redis event dissemination.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Step 1 */}
          <div className="industrial-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(52, 211, 153, 0.12)', padding: '0.5rem', borderRadius: '6px', color: 'var(--accent-green)', display: 'flex' }}>
                <Lock size={20} />
              </div>
              <div>
                <span className="badge badge-green">STEP 1</span>
                <h3 style={{ fontSize: '1.1rem', display: 'inline-block', marginLeft: '0.5rem' }}>PostgreSQL Row Locking (`SELECT ... FOR UPDATE`)</h3>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              To prevent phantom bid wins when multiple bids hit different server nodes simultaneously, BidWire wraps the entire operation in a PostgreSQL transaction (`prisma.$transaction`) and issues a raw SQL <code style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>FOR UPDATE</code> query. This exclusively locks the targeted listing row at the Postgres storage engine level.
            </p>

            <div className="code-block">
              <pre>
<code><span className="code-kw">export async function</span> <span className="code-fn">placeBid</span>&#40;&#123; listingId, bidderName, amount &#125;: PlaceBidParams&#41; &#123;
  <span className="code-kw">return</span> prisma.<span className="code-fn">$transaction</span>&#40;<span className="code-kw">async</span> &#40;tx&#41; &#123;
    <span className="code-cm">// Lock listing row exclusively for this transaction</span>
    <span className="code-kw">const</span> listings = <span className="code-kw">await</span> tx.<span className="code-fn">$queryRaw</span>&lt;Listing[]&gt;`
      <span className="code-str">SELECT * FROM "listings" WHERE id = $&#123;listingId&#125; FOR UPDATE</span>
    `;
    <span className="code-kw">const</span> listing = listings[<span className="code-num">0</span>];

    <span className="code-kw">if</span> &#40;amount &lt;= listing.currentHighestBid&#41; &#123;
      <span className="code-kw">return</span> &#123; success: <span className="code-kw">false</span>, error: <span className="code-str">"Bid amount too low"</span> &#125;;
    &#125;

    <span className="code-kw">await</span> tx.bid.<span className="code-fn">create</span>&#40;&#123; data: &#123; listingId, bidderName, amount &#125; &#125;&#41;;
    <span className="code-kw">await</span> tx.listing.<span className="code-fn">update</span>&#40;&#123;
      where: &#123; id: listingId &#125;,
      data: &#123; currentHighestBid: amount, currentHighestBidderName: bidderName &#125;
    &#125;&#41;;

    <span className="code-kw">return</span> &#123; success: <span className="code-kw">true</span> &#125;;
  &#125;&#41;;
&#125;</code>
              </pre>
            </div>
          </div>

          {/* Step 2 */}
          <div className="industrial-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.12)', padding: '0.5rem', borderRadius: '6px', color: 'var(--accent-cyan)', display: 'flex' }}>
                <Radio size={20} />
              </div>
              <div>
                <span className="badge badge-cyan">STEP 2</span>
                <h3 style={{ fontSize: '1.1rem', display: 'inline-block', marginLeft: '0.5rem' }}>Cross-Instance Pub/Sub Fan-Out (`@socket.io/redis-adapter`)</h3>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              Once PostgreSQL commits the new bid, the receiving backend node emits a Socket.IO room event. The Redis adapter automatically intercepts this call and publishes the payload to Upstash Redis, fanning out the message to all other backend instances in milliseconds.
            </p>

            <div className="code-block">
              <pre>
<code><span className="code-cm">// Socket.IO room broadcast — automatically intercepted & fanned out via Redis</span>
io.<span className="code-fn">to</span>&#40;<span className="code-str">`listing:&#36;&#123;listingId&#125;`</span>&#41;.<span className="code-fn">emit</span>&#40;<span className="code-str">"bid_update"</span>, &#123;
  listingId,
  amount: newAmount,
  bidderName,
  timestamp: <span className="code-kw">new</span> <span className="code-fn">Date</span>&#40;&#41;.<span className="code-fn">toISOString</span>&#40;&#41;,
  nodeOrigin: process.env.INSTANCE_ID
&#125;&#41;;</code>
              </pre>
            </div>
          </div>

          {/* Step 3 */}
          <div className="industrial-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(251, 191, 36, 0.12)', padding: '0.5rem', borderRadius: '6px', color: 'var(--node-2-color)', display: 'flex' }}>
                <Database size={20} />
              </div>
              <div>
                <span className="badge badge-node2">STEP 3</span>
                <h3 style={{ fontSize: '1.1rem', display: 'inline-block', marginLeft: '0.5rem' }}>Presence Tracking & Distributed Auto-Close</h3>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              - <strong>Presence Tracking:</strong> Uses Redis Sets (<code style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>SADD</code>, <code style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>SREM</code>, <code style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>SCARD</code>) for instant $O(1)$ presence calculations across all nodes.<br />
              - <strong>Auto-Close Lock:</strong> Periodically acquires <code style={{ color: 'var(--node-2-color)', fontFamily: 'var(--font-mono)' }}>SET auction:close_lock:ID 1 EX 30 NX</code> in Redis so only one node finalizes an expired auction.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
