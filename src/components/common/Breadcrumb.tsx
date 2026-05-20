type BreadcrumbProps = {
    pageTitle?: string;
    title?: string;
};

export default function Breadcrumb({ pageTitle, title }: BreadcrumbProps) {
    const displayTitle = pageTitle || title || "پاڼه";

    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                {displayTitle}
            </h2>

            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                عمومي پاڼه / {displayTitle}
            </div>
        </div>
    );
}