import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from "@react-email/components";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationEmailProps {
  orderNumber: string;
  guestName: string;
  items: OrderItem[];
  total: number;
  paymentMethod: "STRIPE" | "PAY_ON_PICKUP";
}

export function OrderConfirmationEmail({
  orderNumber,
  guestName,
  items,
  total,
  paymentMethod,
}: OrderConfirmationEmailProps) {
  const isPayOnPickup = paymentMethod === "PAY_ON_PICKUP";

  return (
    <Html>
      <Head />
      <Preview>
        Your order #{orderNumber} has been confirmed - Essa Cafe
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.logo}>Essa Cafe</Heading>
            <Heading style={styles.title}>Order Confirmed!</Heading>
          </Section>

          {/* Greeting */}
          <Section style={styles.section}>
            <Text style={styles.text}>
              Hi {guestName}, your order is confirmed!
            </Text>
          </Section>

          {/* Payment Banner */}
          <Section
            style={{
              ...styles.banner,
              backgroundColor: isPayOnPickup ? "#fef3c7" : "#d1fae5",
            }}
          >
            <Text
              style={{
                ...styles.bannerText,
                color: isPayOnPickup ? "#92400e" : "#065f46",
              }}
            >
              {isPayOnPickup
                ? "You've selected pay on pickup — bring cash or card when you arrive"
                : "Payment received — thank you!"}
            </Text>
          </Section>

          {/* Order Number */}
          <Section style={styles.orderNumberSection}>
            <Text style={styles.orderNumberLabel}>Order Number</Text>
            <Text style={styles.orderNumber}>{orderNumber}</Text>
          </Section>

          {/* Items Table */}
          <Section style={styles.section}>
            <Heading style={styles.sectionTitle}>Order Summary</Heading>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Product</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Qty</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{item.name}</td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      {item.quantity}
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      ${item.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td
                    colSpan={2}
                    style={{ ...styles.td, fontWeight: "bold", borderTop: "2px solid #3b1f0e" }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      fontWeight: "bold",
                      textAlign: "right",
                      borderTop: "2px solid #3b1f0e",
                    }}
                  >
                    ${total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Pickup Details */}
          <Section style={styles.pickupSection}>
            <Heading style={styles.sectionTitle}>Pickup Details</Heading>
            <Text style={styles.text}>
              Your order will be ready for pickup soon. We&apos;ll email you when it&apos;s ready.
            </Text>
            <Text style={styles.pickupAddress}>
              <strong>Essa Cafe</strong>
              <br />
              123 Green Street
              <br />
              Your City, State 00000
            </Text>
            <Text style={styles.text}>
              <strong>Hours:</strong> Mon–Fri 9am–6pm, Sat 9am–5pm
            </Text>
            <Text style={styles.text}>
              Questions? Reply to this email
            </Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Essa Cafe - Local plants and seeds
            </Text>
            <Text style={styles.footerSmall}>
              You&apos;re receiving this email because you placed an order on our website.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f5f1ed",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    maxWidth: "600px",
    padding: "20px",
  },
  header: {
    backgroundColor: "#3b1f0e",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center" as const,
  },
  logo: {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 0 8px 0",
  },
  title: {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0,
  },
  section: {
    marginTop: "24px",
  },
  sectionTitle: {
    color: "#3b1f0e",
    fontSize: "18px",
    fontWeight: "bold",
    margin: "0 0 12px 0",
  },
  text: {
    color: "#374151",
    fontSize: "16px",
    lineHeight: "1.5",
    margin: "0 0 12px 0",
  },
  banner: {
    borderRadius: "8px",
    marginTop: "24px",
    padding: "16px",
    textAlign: "center" as const,
  },
  bannerText: {
    fontSize: "16px",
    fontWeight: "500",
    margin: 0,
  },
  orderNumberSection: {
    backgroundColor: "#f5f1ed",
    border: "2px solid #3b1f0e",
    borderRadius: "8px",
    marginTop: "24px",
    padding: "20px",
    textAlign: "center" as const,
  },
  orderNumberLabel: {
    color: "#6b7280",
    fontSize: "14px",
    margin: "0 0 8px 0",
    textTransform: "uppercase" as const,
  },
  orderNumber: {
    color: "#3b1f0e",
    fontSize: "32px",
    fontWeight: "bold",
    letterSpacing: "2px",
    margin: 0,
  },
  table: {
    borderCollapse: "collapse" as const,
    width: "100%",
  },
  th: {
    borderBottom: "2px solid #3b1f0e",
    color: "#3b1f0e",
    fontSize: "14px",
    fontWeight: "600",
    padding: "12px 8px",
    textAlign: "left" as const,
    textTransform: "uppercase" as const,
  },
  td: {
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: "14px",
    padding: "12px 8px",
  },
  pickupSection: {
    backgroundColor: "#fdf8f0",
    borderRadius: "8px",
    marginTop: "24px",
    padding: "20px",
  },
  pickupAddress: {
    color: "#374151",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "16px 0",
  },
  hr: {
    borderColor: "#e5e7eb",
    margin: "32px 0 16px 0",
  },
  footer: {
    textAlign: "center" as const,
  },
  footerText: {
    color: "#6b7280",
    fontSize: "14px",
    margin: "0 0 8px 0",
  },
  footerSmall: {
    color: "#9ca3af",
    fontSize: "12px",
    margin: 0,
  },
};
