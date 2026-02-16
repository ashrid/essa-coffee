export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-forest-600 text-cream-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-2">ShopSeeds</h3>
            <p className="text-cream-200 text-sm">Pickup only — no shipping</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Location</h4>
            <p className="text-cream-200 text-sm">
              123 Green Street
              <br />
              Your City, State 00000
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Hours</h4>
            <p className="text-cream-200 text-sm">Mon–Sat 9am–6pm</p>
            <p className="text-cream-200 text-sm">Sunday Closed</p>
          </div>
        </div>

        <div className="border-t border-forest-500 mt-8 pt-6 text-center">
          <p className="text-cream-200 text-sm">
            © {currentYear} ShopSeeds. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
