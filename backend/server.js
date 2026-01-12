import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const {
  NOWPAYMENTS_API_KEY,
  NOWPAYMENTS_EMAIL,
  NOWPAYMENTS_PASSWORD,
  PAYOUT_SECRET,
} = process.env;

app.post("/process-payout", async (req, res) => {
  try {
    // SECRET AUTH
    if (req.headers["x-payout-secret"] !== PAYOUT_SECRET) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { address, currency, amount, ipn_callback_url } = req.body;

    // AUTH
    const auth = await axios.post(
      "https://api.nowpayments.io/v1/auth",
      {
        email: NOWPAYMENTS_EMAIL,
        password: NOWPAYMENTS_PASSWORD,
      }
    );

    const jwt = auth.data.token;

    // PAYOUT
    const payout = await axios.post(
      "https://api.nowpayments.io/v1/payout",
      {
        withdrawals: [
          {
            address,
            currency,
            amount,
            ipn_callback_url,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "x-api-key": NOWPAYMENTS_API_KEY,
        },
      }
    );

    res.json(payout.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      error: "NowPayments payout failed",
      details: err.response?.data,
    });
  }
});

app.listen(4000, () => {
  console.log("Payout backend running on port 4000");
});
