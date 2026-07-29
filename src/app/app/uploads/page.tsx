import { UploadWizard } from "@/components/spend/upload-wizard";

export default function UploadsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Tải lên Excel</h1>
      <UploadWizard />
    </main>
  );
}
