export interface OnlinePayClasses {
  container?: string;
  heading?: string;
  label?: string;
  input?: string;
  inputError?: string;
  errorText?: string;
  button?: string;
  fieldWrapper?: string;
  inputWrapper?: string;
  cardIcon?: string;
  grid?: string;
  gridChild?: string;
  labelWrapper?: string;
  tooltipWrapper?: string;
  tooltipButton?: string;
  tooltipIcon?: string;
  tooltipPopover?: string;
  tooltipArrow?: string;
}

export const semanticClasses: OnlinePayClasses = {
  container: 'online-pay__container',
  heading: 'online-pay__heading',
  label: 'online-pay__label',
  input: 'online-pay__input',
  inputError: 'online-pay__input--error',
  errorText: 'online-pay__error-text',
  button: 'online-pay__button',
  fieldWrapper: 'online-pay__field-wrapper',
  inputWrapper: 'online-pay__input-wrapper',
  cardIcon: 'online-pay__card-icon',
  grid: 'online-pay__grid',
  gridChild: 'online-pay__grid-child',
  labelWrapper: 'online-pay__label-wrapper',
  tooltipWrapper: 'online-pay__tooltip-wrapper',
  tooltipButton: 'online-pay__tooltip-button',
  tooltipIcon: 'online-pay__tooltip-icon',
  tooltipPopover: 'online-pay__tooltip-popover',
  tooltipArrow: 'online-pay__tooltip-arrow',
};

export const defaultClasses: OnlinePayClasses = {
  container:
    'w-full max-w-md mx-auto p-4 sm:p-6 bg-white shadow-md rounded-md space-y-4',
  heading: 'text-2xl font-bold text-gray-900',
  label: 'block text-sm font-medium text-gray-700',
  input:
    'block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
  inputError: 'border-red-500 focus:ring-red-500 focus:border-red-500',
  errorText: 'mt-2 text-sm text-red-600',
  button:
    'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed',
  fieldWrapper: 'space-y-1',
  inputWrapper: 'relative',
  cardIcon:
    'absolute top-1/2 right-3 transform -translate-y-1/2 h-6 w-10 object-contain pointer-events-none',
  grid: 'grid grid-cols-2 gap-4',
  labelWrapper: 'flex items-center h-6',
  tooltipWrapper: 'relative ml-2',
  tooltipButton: 'text-gray-400 hover:text-gray-600',
  tooltipIcon: 'h-4 w-4',
  tooltipPopover:
    'absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10',
  tooltipArrow:
    'absolute top-full right-1 -mt-1 border-4 border-transparent border-t-gray-800',
};
