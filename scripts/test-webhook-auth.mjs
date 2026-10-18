async function run() {
  const tenantId = "919a60e9-57ca-4879-ba14-f389e79e8e76";
  const url = `http://localhost:5043/api/v1/leads/webhook/whatsapp?tenantId=${tenantId}`;
  const payload = JSON.stringify({
    customerName: "Security Probe",
    phone: "+919876543210",
    message: "Inbound WhatsApp test message",
    messageId: `WA_${Date.now()}`
  });

  console.log("--- TEST 1: Missing Token ---");
  const res1 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload
  });
  console.log("Status:", res1.status, await res1.json());

  console.log("--- TEST 2: Invalid Token ---");
  const res2 = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WhatsApp-Token": "invalid_forged_secret_token"
    },
    body: payload
  });
  console.log("Status:", res2.status, await res2.json());

  console.log("--- TEST 3: Valid Token ---");
  const res3 = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WhatsApp-Token": "sparovia_wa_webhook_secret_key_v1"
    },
    body: payload
  });
  console.log("Status:", res3.status, await res3.json());
}

run().catch(console.error);
