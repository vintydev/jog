type QuestionStep = {
    id: string;
    question: string;
    type?: "scale" | "text";
    subtitle?: string;
};

export default QuestionStep;