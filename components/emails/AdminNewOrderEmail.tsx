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
  Link,
  Button,
} from "@react-email/components";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface AdminNewOrderEmailProps {
  orderNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  items: OrderItem[];
  total: number;
  paymentMethod: "STRIPE" | "PAY_ON_PICKUP";
  adminUrl: string;
}

export function AdminNewOrderEmail({
  orderNumber,
  guestName,
  guestEmail,
  guestPhone,
  items,
  total,
  paymentMethod,
  adminUrl,
}: AdminNewOrderEmailProps) {
  const isPayOnPickup = paymentMethod === "PAY_ON_PICKUP";

  return (
    <Html>
      <Head />
      <Preview>
        New Order #{orderNumber} from {guestName} - Essa Cafe
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.title}>New Order Received</Heading>
            <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
          </Section>

          {/* Payment Method Badge */}
          <Section style={styles.section}>
            <Text style={styles.text}>
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: isPayOnPickup ? "#fef3c7" : "#d1fae5",
                  color: isPayOnPickup ? "#92400e" : "#065f46",
                }}
              >
                {isPayOnPickup ? "Pay on Pickup" : "Paid via Stripe"}
              </span>
            </Text>
          </Section>

          {/* Customer Details */}
          <Section style={styles.section}>
            <Heading style={styles.sectionTitle}>Customer Details</Heading>
            <div style={styles.customerDetails}>
              <Text style={styles.detailRow}>
                <strong>Name:</strong> {guestName}
              </Text>
              <Text style={styles.detailRow}>
                <strong>Email:</strong>{" "}
                <Link href={`mailto:${guestEmail}`} style={styles.link}>
                  {guestEmail}
                </Link>
              </Text>
              {guestPhone && (
                <Text style={styles.detailRow}>
                  <strong>Phone:</strong> {guestPhone}
                </Text>
              )}
            </div>
          </Section>

          {/* Items Table */}
          <Section style={styles.section}>
            <Heading style={styles.sectionTitle}>Order Items</Heading>
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
                    style={{
                      ...styles.td,
                      fontWeight: "bold",
                      borderTop: "2px solid #345a16",
                    }}
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
                    ${total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* CTA Button */}
          <Section style={styles.ctaSection}>
            <Button href={adminUrl} style={styles.button}>
              View Order in Admin
            </Button>
          </Section>

          <Hr style={styles.hr} />

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Essa Cafe Admin Notification
            </Text>
            <Text style={styles.footerSmall}>
              This is an automated notification for new orders.
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
  title: {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 0 8px 0",
  },
  orderNumber: {
    color: "#d1fae5",
    fontSize: "18px",
    fontWeight: "600",
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
    margin: 0,
  },
  badge: {
    borderRadius: "9999px",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "600",
    padding: "6px 16px",
  },
  customerDetails: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px",
  },
  detailRow: {
    color: "#374151",
    fontSize: "14px",
    margin: "0 0 8px 0",
  },
  link: {
    color: "#345a16",
    textDecoration: "underline",
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
  ctaSection: {
    marginTop: "32px",
    textAlign: "center" as const,
  },
  button: {
    backgroundColor: "#345a16",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "16px",
    fontWeight: "600",
    padding: "16px 32px",
    textDecoration: "none",
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
