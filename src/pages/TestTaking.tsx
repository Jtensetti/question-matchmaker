
import { useParams } from "react-router-dom";
import { useTestTaking } from "@/hooks/use-test-taking";
import { LoadingView } from "@/components/test/LoadingView";
import { ErrorView } from "@/components/test/ErrorView";
import { StudentNameForm } from "@/components/test/StudentNameForm";
import { TestQuestionView } from "@/components/test/TestQuestionView";
import { toast } from "@/hooks/use-toast";

const TestTaking = () => {
  const { testId } = useParams();
  const { 
    loading,
    test,
    testQuestions,
    currentQuestionIndex,
    studentName,
    setStudentName,
    answer,
    setAnswer,
    nameEntered,
    submitting,
    captchaAnswer,
    setCaptchaAnswer,
    captchaQuestion,
    expectedCaptchaAnswer,
    generateCaptcha,
    handleNameSubmit,
    handleAnswerSubmit
  } = useTestTaking(testId);

  if (loading) {
    return <LoadingView />;
  }

  if (!test || testQuestions.length === 0) {
    return <ErrorView onGoBack={() => window.location.href = '/'} />;
  }

  if (!nameEntered) {
    return (
      <StudentNameForm
        test={test}
        studentName={studentName}
        setStudentName={setStudentName}
        onSubmit={handleNameSubmit}
        captchaQuestion={captchaQuestion}
        captchaAnswer={captchaAnswer}
        setCaptchaAnswer={setCaptchaAnswer}
        expectedCaptchaAnswer={expectedCaptchaAnswer}
        generateCaptcha={generateCaptcha}
      />
    );
  }

  const currentQuestion = testQuestions[currentQuestionIndex];
  if (!currentQuestion) {
    toast({
      title: "Error",
      description: "Could not load question",
      variant: "destructive",
    });
    return <ErrorView onGoBack={() => window.location.href = '/'} />;
  }

  return (
    <TestQuestionView
      test={test}
      studentName={studentName}
      currentQuestionIndex={currentQuestionIndex}
      testQuestions={testQuestions}
      answer={answer}
      setAnswer={setAnswer}
      submitting={submitting}
      handleAnswerSubmit={handleAnswerSubmit}
    />
  );
};

export default TestTaking;
