
import { DatabaseReset } from "@/components/admin/DatabaseReset";

const DatabaseResetPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Database Administration</h1>
        <DatabaseReset />
      </div>
    </div>
  );
};

export default DatabaseResetPage;
