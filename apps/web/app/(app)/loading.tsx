// Skeleton premium exibido durante a navegação (streaming do App Router).
export default function Loading() {
  return (
    <div className="p-5 md:p-7">
      <div className="mb-6 flex items-center gap-3.5">
        <div className="nx-skelbar h-11 w-11 rounded-xl" />
        <div className="space-y-2">
          <div className="nx-skelbar h-5 w-52 rounded-md" />
          <div className="nx-skelbar h-3 w-36 rounded-md" />
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="nx-skelbar h-24 rounded-2xl" />
        ))}
      </div>
      <div className="nx-skelbar h-80 rounded-2xl" />
    </div>
  );
}
