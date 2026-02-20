
import { buttonVariants, ButtonProps } from "@/components/ui/button"
import { type VariantProps } from "class-variance-authority"

// Check if buttonVariants has variants
type Variants = VariantProps<typeof buttonVariants>
// If types are correct, Variants should have 'variant' and 'size'

const test: Variants = {
    variant: "default",
    size: "default"
}

const props: ButtonProps = {
    variant: "destructive",
    size: "sm"
}
