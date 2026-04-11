import Image from "next/image";
import type { EmptyExamListStateProps } from "@/types/employer/components";

export function EmptyExamListState({ title, description }: EmptyExamListStateProps) {
  return (
    <section className="rounded-lg bg-white p-5">
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-5 text-center">
        <Image
          src="/empty.svg"
          alt="No exams available"
          width={120}
          height={120}
          className="h-[120px] w-[120px]"
          priority={false}
        />

        <div className="space-y-3">
          <h3 className="text-[20px] font-semibold leading-[140%] text-slate-700">{title}</h3>
          <p className="max-w-[539px] text-sm font-normal leading-[140%] text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
