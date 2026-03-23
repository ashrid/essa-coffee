export const metadata = {
  title: "Pickup Information | Essa Cafe",
  description: "Find our location, hours, and pickup instructions.",
};

export default function PickupInfoPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-forest-900 mb-8">
        Pickup Information
      </h1>

      {/* Location */}
      <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-forest-700 mb-3">
          Location
        </h2>
        <p className="text-forest-900">
          123 Green Street
          <br />
          Your City, State 00000
        </p>
      </div>

      {/* Hours */}
      <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-forest-700 mb-3">
          Hours
        </h2>
        <table className="w-full text-sm text-forest-900">
          <tbody>
            <tr className="border-b border-cream-100">
              <td className="py-2 font-medium">Monday – Friday</td>
              <td className="py-2 text-right">9:00 AM – 6:00 PM</td>
            </tr>
            <tr className="border-b border-cream-100">
              <td className="py-2 font-medium">Saturday</td>
              <td className="py-2 text-right">9:00 AM – 5:00 PM</td>
            </tr>
            <tr>
              <td className="py-2 font-medium">Sunday</td>
              <td className="py-2 text-right text-sage-500">Closed</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-forest-700 mb-3">
          How It Works
        </h2>
        <p className="text-forest-900 leading-relaxed">
          Order online, pay online or pay when you pick up. We&apos;ll email you when
          your order is ready for pickup. Just show up during our hours and
          we&apos;ll have everything prepared for you.
        </p>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6">
        <h2 className="text-xl font-semibold text-forest-700 mb-3">
          Map
        </h2>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-74.00369368400567!3d40.71312937933185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQyJzQ3LjMiTiA3NMKwMDAnMTMuMyJX!5e0!3m2!1sen!2sus!4v1234567890"
          className="w-full h-64 rounded-lg border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Store Location Map"
        />
      </div>
    </div>
  );
}
