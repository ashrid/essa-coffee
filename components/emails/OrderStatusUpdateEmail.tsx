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

interface OrderStatusUpdateEmailProps {
  orderNumber: string;
  guestName: string;
  items: OrderItem[];
  total: number;
  status: "CANCELLED" | "REFUNDED";
  trackingUrl: string;
  shopAddress: {
    line1: string;
    line2: string;
  };
  hoursSummary: string;
}

export function OrderStatusUpdateEmail({
  orderNumber,
  guestName,
  items,
  total,
  status,
  trackingUrl,
  shopAddress,
  hoursSummary,
}: OrderStatusUpdateEmailProps) {
  const isCancelled = status === "CANCELLED";
  const title = isCancelled ? "Order Cancelled" : "Order Refunded";
  const bannerColor = isCancelled ? "#fef2f2" : "#f0f9ff";
  const bannerBorderColor = isCancelled ? "#dc2626" : "#0284c7";
  const bannerTextColor = isCancelled ? "#991b1b" : "#0369a1";
  const message = isCancelled
    ? "Your order has been cancelled. No payment has been charged."
    : "Your order has been refunded. The refund will be processed within 5-10 business days.";

  return (
    <Html>
      <Head />
      <Preview>
        Order #{orderNumber} {isCancelled ? "cancelled" : "refunded"} - Essa Cafe
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.logo}>Essa Cafe</Heading>
            <Heading style={styles.title}>{title}</Heading>
          </Section>

          {/* Status Banner */}
          <Section
            style={{
              ...styles.banner,
              backgroundColor: bannerColor,
              borderColor: bannerBorderColor,
            }}
          >
            <Text
              style={{
                ...styles.bannerText,
                color: bannerTextColor,
              }}
            >
              {message}
            </Text>
          </Section>

          {/* Greeting */}
          <Section style={styles.section}>
            <Text style={styles.text}>
              Hi {guestName},
            </Text>
            <Text style={styles.text}>
              We&apos;re writing to inform you that your order has been{" "}
              {isCancelled ? "cancelled" : "refunded"}.
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
                      AED {item.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td
                    colSpan={2}
                    style={{ ...styles.td, fontWeight: "bold", borderTop: "2px solid #345a16" }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      fontWeight: "bold",
                      textAlign: "right",
                      borderTop: "2px solid #345a16",
                    }}
                  >
                    AED {total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Refund Details for Refunded Orders */}
          {!isCancelled && (
            <Section style={styles.refundSection}>
              <Heading style={styles.sectionTitle}>Refund Details</Heading>
              <Text style={styles.text}>
                <strong>Refund Amount:</strong> AED {total.toFixed(2)}
              </Text>
              <Text style={styles.text}>
                <strong>Processing Time:</strong> 5-10 business days
              </Text>
              <Text style={styles.text}>
                The refund will be credited back to your original payment method.
              </Text>
            </Section>
          )}

          {/* Track Order */}
          <Section style={styles.trackSection}>
            <Heading style={styles.sectionTitle}>Order Status</Heading>
            <Text style={styles.text}>
              You can view your order details anytime:
            </Text>
            <div style={styles.buttonContainer}>
              <a href={trackingUrl} style={styles.button}>
                View Order Status
              </a>
            </div>
          </Section>

          {/* Questions */}
          <Section style={styles.questionsSection}>
            <Text style={styles.text}>
              If you have any questions or need assistance, please reply to this email
              or contact us during business hours.
            </Text>
            <Text style={styles.text}>
              <strong>Essa Cafe</strong>
              <br />
              {shopAddress.line1}
              <br />
              {shopAddress.line2}
              <br />
              {hoursSummary}
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
    backgroundColor: "#f4f8ec",
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
    backgroundColor: "#345a16",
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
  banner: {
    border: "2px solid",
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
  section: {
    marginTop: "24px",
  },
  sectionTitle: {
    color: "#345a16",
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
  orderNumberSection: {
    backgroundColor: "#f5f1ed",
    border: "2px solid #345a16",
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
    color: "#345a16",
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
    borderBottom: "2px solid #345a16",
    color: "#345a16",
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
  refundSection: {
    backgroundColor: "#f0f9ff",
    border: "2px solid #0284c7",
    borderRadius: "8px",
    marginTop: "24px",
    padding: "20px",
  },
  trackSection: {
    backgroundColor: "#f5f3ff",
    border: "2px solid #7c3aed",
    borderRadius: "8px",
    marginTop: "24px",
    padding: "20px",
    textAlign: "center" as const,
  },
  buttonContainer: {
    marginTop: "16px",
  },
  button: {
    backgroundColor: "#7c3aed",
    borderRadius: "6px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "16px",
    fontWeight: "600",
    padding: "14px 28px",
    textDecoration: "none",
  },
  questionsSection: {
    backgroundColor: "#edf5da",
    borderRadius: "8px",
    marginTop: "24px",
    padding: "20px",
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
