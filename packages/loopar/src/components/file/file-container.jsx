export default function FileContainer(props) {
  return (
    <div
      className="w-full h-full bg-background p-4 overflow-auto"
    >
      <div className="relative">
        <div className='flex flex-wrap gap-6 justify-center'>
          {props.children}
        </div>
      </div>
    </div>
  )
}