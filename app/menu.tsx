import { ArrowRight, ArrowRightLeft, ClipboardCheck, LayoutDashboard, MapPin } from "lucide-react";
import Link from "next/link";

const SUB_TOOLS: {
    href: string;
    label: string;
    desc: string;
    icon: React.ReactNode;
    available: boolean;
}[] = [
        {
            href: "/rkbmd",
            label: "Dashboard RKBMD",
            desc: "Penyusunan Rencana Kebutuhan Barang Milik Daerah berdasarkan data hasil import",
            icon: <LayoutDashboard size={18} />,
            available: true,
        },
        {
            href: "#pengalihan",
            label: "Pengalihan Status Penggunaan",
            desc: "Pengelolaan proses alih status penggunaan BMD antar pengguna barang",
            icon: <ArrowRightLeft size={18} />,
            available: false,
        },
        {
            href: "#penetapan",
            label: "Penetapan Status Penggunaan",
            desc: "Administrasi dan penetapan status penggunaan Barang Milik Daerah",
            icon: <ClipboardCheck size={18} />,
            available: false,
        },
        {
            href: "sebaran",
            label: "Sebaran BMD",
            desc: "Visualisasi dan pemetaan sebaran aset/barang milik daerah per lokasi",
            icon: <MapPin size={18} />,
            available: false,
        },
    ];
export function Menu() {
    return (

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUB_TOOLS.map(({ href, label, desc, icon, available }) => (
                    available ? (
                        <Link
                            key={href}
                            href={href}
                            className="group flex flex-col gap-1.5 rounded-xl border border-default-200 bg-accent hover:border-primary hover:shadow-sm p-3 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-foreground">{icon}</span>
                                <ArrowRight size={13} className="text-default-300 group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
                            <p className="text-xs text-default-400 leading-tight">{desc}</p>
                        </Link>
                    ) : (
                        <div
                            key={href}
                            className="flex flex-col gap-1.5 rounded-xl border border-dashed border-default-200 bg-muted p-3 opacity-60 cursor-not-allowed"
                            title="Segera hadir"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-default-400">{icon}</span>
                                <span className="text-[10px] text-default-400 font-medium px-1.5 py-0.5 rounded">Soon</span>
                            </div>
                            <p className="text-xs font-semibold text-default-600 leading-tight">{label}</p>
                            <p className="text-xs text-default-400 leading-tight">{desc}</p>
                        </div>
                    )
                ))}
            </div>  );
}