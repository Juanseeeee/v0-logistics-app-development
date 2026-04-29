const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
  envFile.split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) return [match[1], match[2].replace(/^["']|["']$/g, '').trim()];
      return [];
    })
    .filter((entry) => entry.length === 2)
);

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
  const { data: trips, error: tripsError } = await supabase
    .from("l2_trips")
    .select("client_id, trip_amount, third_party_amount, invoice_date, payment_date, tons_delivered, clients(company)")

  if (tripsError) {
    console.error("Error fetching l2_trips:", tripsError)
  }

  const clientProfitMap = new Map()
  if (trips) {
    trips.forEach((trip) => {
      let clientName = "Desconocido"
      if (trip.clients) {
        if (Array.isArray(trip.clients)) {
          clientName = trip.clients[0]?.company || "Desconocido"
        } else {
          clientName = trip.clients.company || "Desconocido"
        }
      }
      const tripAmount = Number.parseFloat(trip.trip_amount) || 0
      const thirdPartyAmount = Number.parseFloat(trip.third_party_amount) || 0
      const profit = tripAmount - thirdPartyAmount
      clientProfitMap.set(clientName, (clientProfitMap.get(clientName) || 0) + profit)
    })
  }
  const clientProfitData = Array.from(clientProfitMap.entries())
    .map(([name, profit]) => ({ name, "Ganancia": profit }))
    .sort((a, b) => b["Ganancia"] - a["Ganancia"])
    .slice(0, 5)

  console.log("Client Profit Data:", clientProfitData);
}

run();