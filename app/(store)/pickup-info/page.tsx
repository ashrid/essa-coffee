export const metadata = {
  title: "Pickup Information | Essa Cafe",
  description: "Find our location, hours, and pickup instructions.",
};

import { resolveGoogleMapsEmbedUrl } from "@/lib/google-maps-embed";
import { getDetailedHours } from "@/lib/shop-hours";

export default function PickupInfoPage() {
  const addressLine1 = process.env.SHOP_ADDRESS_LINE1 || "Essa Cafe";
  const addressLine2 = process.env.SHOP_ADDRESS_LINE2 || "Dubai, UAE";
  const phone = process.env.SHOP_PHONE || "";
  const mapEmbedUrl = resolveGoogleMapsEmbedUrl(process.env.GOOGLE_MAPS_EMBED_URL);
  const hours = getDetailedHours();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-forest-900 mb-8">
        Pickup Information
      </h1>

      {/* Location */}
      <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-forest-700 mb-3">Location</h2>
        <p className="text-forest-900">
          {addressLine1}
          <br />
          {addressLine2}
        </p>
        {phone && (
          <p className="text-forest-900 mt-2">
            <a href={`tel:${phone}`} className="hover:underline">
              {phone}
            </a>
          </p>
        )}
      </div>

      {/* Hours */}
      <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-forest-700 mb-3">Hours</h2>
        <table className="w-full text-sm text-forest-900">
          <tbody>
            {hours.map((row, index) => (
              <tr
                key={row.day}
                className={index < hours.length - 1 ? "border-b border-cream-100" : ""}
              >
                <td className="py-2 font-medium">{row.day}</td>
                <td className={`py-2 text-right ${row.hours === "Closed" ? "text-sage-500" : ""}`}>
                  {row.hours}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-forest-700 mb-3">How It Works</h2>
        <p className="text-forest-900 leading-relaxed">
          Order online, pay online or pay when you pick up. We&apos;ll email you when
          your order is ready for pickup. Just show up during our hours and
          we&apos;ll have everything prepared for you.
        </p>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6">
        <h2 className="text-xl font-semibold text-forest-700 mb-3">Map</h2>
        {mapEmbedUrl ? (
          <iframe
            src={mapEmbedUrl}
            className="w-full h-64 rounded-lg border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Essa Cafe Location"
          />
        ) : (
          <p className="text-sm text-sage-500 italic">
            Location map coming soon.
          </p>
        )}
      </div>
    </div>
  );
}
