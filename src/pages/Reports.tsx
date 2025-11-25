export default function Reports() {
  const download = (path: string) => {
    window.open(path, "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Reporting Module</h1>

      <p className="text-gray-700 mb-10">
        Generate downloadable PDF or CSV reports for volunteer participation and
        event assignment data. Reports are created live from the database and
        downloaded directly via your browser.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-2">
          Volunteer Participation History
        </h2>
        <p className="text-gray-600 mb-4">
          Includes participation status, hours volunteered, and event history.
        </p>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => download("/api/reports/volunteers/csv")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Download CSV
          </button>

          <button
            onClick={() => download("/api/reports/volunteers/pdf")}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Download PDF
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">
          Event Details & Volunteer Assignments
        </h2>
        <p className="text-gray-600 mb-4">
          Lists all events, assigned volunteers, and event details.
        </p>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => download("/api/reports/events/csv")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Download CSV
          </button>

          <button
            onClick={() => download("/api/reports/events/pdf")}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Download PDF
          </button>
        </div>
      </section>
    </div>
  );
}
