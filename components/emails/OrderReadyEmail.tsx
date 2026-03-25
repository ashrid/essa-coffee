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
  Img,
} from "@react-email/components";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderReadyEmailProps {
  orderNumber: string;
  guestName: string;
  items: OrderItem[];
  total: number;
  pickupTime?: Date | null;
  qrCodeCid: string;
  scanUrl: string;
  trackingUrl: string;
  shopAddress: {
    line1: string;
    line2: string;
  };
  hoursSummary: string;
}

function formatPickupTime(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function OrderReadyEmail({
  orderNumber,
  guestName,
  items,
  total,
  pickupTime,
  qrCodeCid,
  scanUrl,
  trackingUrl,
  shopAddress,
  hoursSummary,
}: OrderReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your order #{orderNumber} is ready for pickup - Essa Cafe
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.logo}>Essa Cafe</Heading>
            <Heading style={styles.title}>Your Order is Ready!</Heading>
          </Section>

          {/* Greeting */}
          <Section style={styles.section}>
            <Text style={styles.text}>
              Hi {guestName}, your order is ready for pickup!
            </Text>
            <Text style={styles.text}>
              Please bring your QR code when you come to collect your order.
            </Text>
          </Section>

          {/* Order Number */}
          <Section style={styles.orderNumberSection}>
            <Text style={styles.orderNumberLabel}>Order Number</Text>
            <Text style={styles.orderNumber}>{orderNumber}</Text>
          </Section>

          {/* QR Code Section */}
          <Section style={styles.qrSection}>
            <Heading style={styles.sectionTitle}>Your Pickup QR Code</Heading>
            <Text style={styles.qrInstructions}>
              Show this code to our staff when picking up your order.
            </Text>
            <div style={styles.qrContainer}>
              <Img
                src={`cid:${qrCodeCid}`}
                alt="Pickup QR Code"
                width={300}
                height={300}
                style={styles.qrImage}
              />
            </div>
            <Text style={styles.qrFallback}>
              If the QR code doesn&apos;t display, use this link:
              <br />
              <a href={scanUrl} style={styles.qrLink}>
                {scanUrl}
              </a>
            </Text>
            <Text style={styles.qrExpiry}>
              This QR code is valid for 7 days.
            </Text>
          </Section>

          {/* Pickup Time */}
          {pickupTime && (
            <Section style={styles.pickupTimeSection}>
              <Text style={styles.pickupTimeLabel}>Scheduled Pickup</Text>
              <Text style={styles.pickupTime}>{formatPickupTime(pickupTime)}</Text>
            </Section>
          )}

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
                    ${total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Track Order */}
          <Section style={styles.trackSection}>
            <Heading style={styles.sectionTitle}>Track Your Order</Heading>
            <Text style={styles.text}>
              You can check your order status anytime using the link below:
            </Text>
            <div style={styles.buttonContainer}>
              <a href={trackingUrl} style={styles.button}>
                Track Order Status
              </a>
            </div>
          </Section>

          {/* Pickup Details */}
          <Section style={styles.pickupSection}>
            <Heading style={styles.sectionTitle}>Pickup Location</Heading>
            <Text style={styles.pickupAddress}>
              <strong>Essa Cafe</strong>
              <br />
              {shopAddress.line1}
              <br />
              {shopAddress.line2}
            </Text>
            <Text style={styles.text}>
              <strong>Hours:</strong> {hoursSummary}
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
  qrSection: {
    backgroundColor: "#ecfdf5",
    border: "2px solid #059669",
    borderRadius: "8px",
    marginTop: "24px",
    padding: "24px",
    textAlign: "center" as const,
  },
  qrInstructions: {
    color: "#374151",
    fontSize: "16px",
    lineHeight: "1.5",
    margin: "0 0 16px 0",
  },
  qrContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    display: "inline-block",
    padding: "16px",
  },
  qrImage: {
    display: "block",
    height: "300px",
    width: "300px",
  },
  qrFallback: {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "16px 0 0 0",
    wordBreak: "break-all" as const,
  },
  qrLink: {
    color: "#059669",
    textDecoration: "underline",
  },
  qrExpiry: {
    color: "#059669",
    fontSize: "13px",
    fontStyle: "italic",
    margin: "12px 0 0 0",
  },
  pickupTimeSection: {
    backgroundColor: "#fffbeb",
    border: "2px solid #d97706",
    borderRadius: "8px",
    marginTop: "24px",
    padding: "20px",
    textAlign: "center" as const,
  },
  pickupTimeLabel: {
    color: "#d97706",
    fontSize: "14px",
    margin: "0 0 8px 0",
    textTransform: "uppercase" as const,
  },
  pickupTime: {
    color: "#92400e",
    fontSize: "24px",
    fontWeight: "bold",
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
  pickupSection: {
    backgroundColor: "#edf5da",
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
