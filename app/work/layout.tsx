
export default function WorkLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="w-full min-h-[80svh]">
            {children}
        </div>
    );
}