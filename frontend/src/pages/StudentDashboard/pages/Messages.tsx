import React from 'react';

export function Messages() {
  return (
    <div className="flex-1 flex w-full bg-white overflow-hidden shadow-sm border-t border-gray-200 uppercase">

      {/* COLUMN 1 - Conversations List */}
      <div className="w-[300px] flex flex-col border-r border-gray-200 bg-white shrink-0">
        <div className="p-4 border-b border-gray-100 flex flex-col pt-5">
          <div className="flex gap-2 mb-4">
            <button className="bg-gray-800 hover:bg-black transition-colors text-white rounded-lg text-sm font-semibold px-3 py-1.5 flex-1 shadow-sm">Start new conversation</button>
            <button className="border border-gray-300 rounded-lg p-1.5 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors shadow-sm w-10"><i className="fas fa-users"></i></button>
          </div>
          <div className="relative mb-4 flex items-center">
            <i className="fas fa-search absolute left-3 text-gray-400"></i>
            <input type="text" placeholder="Search for chats" className="border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm w-full outline-none focus:border-orange-500 transition-colors" />
          </div>
          <div className="flex text-[0.85rem] font-bold border-b border-gray-200">
            <button className="flex-1 pb-2 border-b-2 border-orange-500 text-orange-600">All</button>
            <button className="flex-1 pb-2 text-gray-500 hover:text-gray-800 transition-colors">Tutors</button>
            <button className="flex-1 pb-2 text-gray-500 hover:text-gray-800 transition-colors">Teams</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
          {[
            { name: 'Dr. Evan Davis', msg: 'Dr. Evan Davis', time: '11:57 PM', unread: 0, active: true },
            { name: 'Dr. Evan Davis', msg: 'Development...', time: '2:53 PM', unread: 3, active: false },
            { name: 'Dr. Evan Davis', msg: 'it Evan...', time: '1:39 PM', unread: 1, active: false },
            { name: 'Alex Johnson', msg: 'so means...', time: '10:08 PM', unread: 3, active: false },
            { name: 'Dr. Evan Davis', msg: 'Last message preview...', time: '12:35 AM', unread: 0, active: false },
          ].map((chat, idx) => (
            <div key={idx} className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-50 transition-colors ${chat.active ? 'bg-orange-50 border-l-4 border-l-orange-500 pl-3' : 'hover:bg-gray-50 border-l-4 border-l-transparent pl-3'}`}>
              <div className="relative shrink-0">
                <img src="/assets/avatar.png" className={`w-[40px] h-[40px] rounded-full object-cover bg-gray-200 ${chat.active ? 'ring-2 ring-white' : ''}`} alt="Avatar" />
                {idx === 0 && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-[0.9rem] truncate ${chat.active ? 'text-orange-900' : 'text-dark-text'}`}>{chat.name}</h4>
                <p className="text-[0.75rem] text-gray-500 truncate mt-0.5">{chat.msg !== 'Dr. Evan Davis' ? `Last message preview ${chat.msg}` : 'Last message preview Dr. Evan...'}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0 min-w-[50px]">
                <span className={`text-[0.65rem] font-bold ${chat.active ? 'text-orange-600' : 'text-gray-400'}`}>{chat.time}</span>
                {chat.unread > 0 && <span className="bg-orange-500 text-white text-[0.65rem] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm">{chat.unread}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 2 - Chat Window */}
      <div className="flex-1 flex flex-col bg-white relative h-full min-w-0">

        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/assets/avatar.png" className="w-[42px] h-[42px] rounded-full object-cover bg-gray-200 ring-2 ring-gray-50" alt="Dr. Evan" />
            </div>
            <div>
              <h2 className="font-bold text-[1.1rem] leading-tight text-dark-text">Dr. Evan Davis</h2>
              <span className="text-[0.75rem] text-gray-500 font-bold flex items-center gap-1.5 mt-0.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Online (Visakhapatnam time)</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"><i className="fas fa-ellipsis-v"></i></button>
          </div>
        </div>

        {/* Messages Layout Container */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 bg-[#FAFAFA] relative">

          <div className="flex items-end gap-3 w-full max-w-lg">
            <img src="/assets/avatar.png" className="w-8 h-8 rounded-full bg-gray-200 shrink-0 mb-1 ring-1 ring-gray-100" alt="Avatar" />
            <div className="flex flex-col gap-1 w-full">
              <div className="bg-white border border-gray-200/60 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 text-[0.95rem] shadow-sm font-medium">
                Hello, messages useful to and your same teams?
              </div>
              <span className="text-[0.65rem] text-gray-400 font-bold ml-2 tracking-wide">7:37 PM</span>
            </div>
          </div>

          <div className="flex items-end gap-3 w-full max-w-lg">
            <img src="/assets/avatar.png" className="w-8 h-8 rounded-full bg-gray-200 shrink-0 mb-1 ring-1 ring-gray-100" alt="Avatar" />
            <div className="flex flex-col gap-1 w-full">
              <div className="bg-white border border-gray-200/60 rounded-2xl rounded-bl-none p-3.5 flex items-center gap-4 shadow-sm w-fit max-w-full hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 text-xl"><i className="fas fa-file-pdf"></i></div>
                <div className="flex-1 pr-4">
                  <h5 className="text-[0.85rem] font-bold leading-tight text-dark-text group-hover:text-orange-600 transition-colors">Project_Brief.pdf</h5>
                  <span className="text-xs text-gray-400 font-bold mt-0.5 inline-block">2.4 MB</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-500 transition-colors"><i className="fas fa-download"></i></div>
              </div>
              <span className="text-[0.65rem] text-gray-400 font-bold ml-2 tracking-wide">7:38 PM</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 self-end w-full max-w-lg">
            <span className="text-[0.7rem] text-gray-400 font-bold mr-2 uppercase tracking-wide">Alex</span>
            <div className="bg-orange-500 text-white rounded-2xl rounded-br-none px-4 py-3 text-[0.95rem] shadow-md font-medium">
              Hey lin kero not tutor information?
            </div>
            <span className="text-[0.65rem] text-gray-400 font-bold mr-2 mt-0.5 tracking-wide">7:38 PM</span>
          </div>

          <div className="flex flex-col items-end gap-1 self-end w-full max-w-lg">
            <span className="text-[0.7rem] text-gray-400 font-bold mr-2 uppercase tracking-wide">Alex</span>
            <div className="bg-orange-500 text-white rounded-2xl rounded-br-none px-4 py-3 text-[0.95rem] shadow-md font-medium">
              Or perhaps some timeline estimates?
            </div>
            <span className="text-[0.65rem] text-gray-400 font-bold mr-2 mt-0.5 tracking-wide">8:33 PM</span>
          </div>

          <div className="flex items-end gap-3 w-full max-w-lg mt-auto">
            <div className="flex -ml-1 mb-1">
              <img src="/assets/avatar.png" className="w-6 h-6 rounded-full border-2 border-white -ml-1 shadow-sm" alt="v" style={{ zIndex: 3 }} />
              <img src="/assets/avatar.png" className="w-6 h-6 rounded-full border-2 border-white -ml-2 opacity-80" alt="v" style={{ zIndex: 2 }} />
              <img src="/assets/avatar.png" className="w-6 h-6 rounded-full border-2 border-white -ml-2 opacity-50" alt="v" style={{ zIndex: 1 }} />
            </div>
            <div className="bg-gray-100 rounded-full px-3 py-1.5 mb-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
            </div>
            <span className="text-[0.7rem] text-gray-400 font-bold italic mb-1.5">Dr. Davis is typing</span>
          </div>
        </div>

        {/* Message Input container */}
        <div className="p-4 bg-white border-t border-gray-200 shrink-0">
          <div className="flex items-center gap-2 bg-gray-50/80 border border-gray-200 rounded-full pr-2 pl-4 py-1.5 focus-within:border-orange-400 focus-within:bg-white focus-within:shadow-sm transition-all">
            <button className="text-gray-400 hover:text-orange-500 transition-colors p-2 rounded-full hover:bg-orange-50"><i className="fas fa-smile text-lg"></i></button>
            <button className="text-gray-400 hover:text-orange-500 transition-colors p-2 rounded-full hover:bg-orange-50"><i className="fas fa-paperclip text-lg"></i></button>
            <input type="text" placeholder="Type a message..." className="flex-1 bg-transparent border-none outline-none text-[0.95rem] font-medium px-2 py-2 w-full text-dark-text placeholder:font-medium placeholder:text-gray-400" />
            <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-full px-5 py-2 text-sm shadow-sm transition-transform hover:-translate-y-0.5 ml-1 flex items-center gap-2">Send <i className="fas fa-paper-plane text-[0.7rem]"></i></button>
          </div>
        </div>
      </div>

      {/* COLUMN 3 - Contact Profile Panel */}
      <div className="w-[280px] flex flex-col border-l border-gray-200 bg-white shrink-0 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col items-center text-center px-4 py-10 border-b border-gray-100 bg-gray-50/50">
          <div className="relative mb-5 inline-block">
            <img src="/assets/avatar.png" className="w-[90px] h-[90px] rounded-full object-cover shadow-sm bg-gray-200 ring-4 ring-white" alt="Dr. Evan" />
            <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-green-500 border-[3px] border-white rounded-full shadow-sm"></div>
          </div>
          <h3 className="font-bold text-[1.2rem] text-dark-text">Dr. Evan Davis</h3>
          <p className="text-[0.8rem] text-gray-500 font-bold mt-1 uppercase tracking-wide">Frontend Development Tutor</p>
        </div>

        <div className="px-6 py-6 border-b border-gray-100">
          <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Course</h4>
          <div className="border border-border-soft bg-white rounded-lg p-3 text-center transition-colors shadow-sm">
            <p className="text-[0.85rem] font-bold text-dark-text">Advanced React & Next.js</p>
          </div>
        </div>

        <div className="px-6 py-6">
          <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Quick action buttons</h4>
          <div className="flex gap-2">
            <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-dark-text rounded-lg px-2 py-2.5 text-[0.8rem] font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5">
              <i className="fas fa-external-link-alt text-gray-400"></i> View Course
            </button>
            <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-2 py-2.5 text-[0.8rem] font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5">
              <i className="fas fa-question-circle"></i> Ask Doubt
            </button>
          </div>
        </div>

        {/* Attachment / Files panel stub */}
        <div className="px-6 py-0 mt-2">
          <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Shared Files (12)</h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
              <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-500"><i className="fas fa-file-pdf"></i></div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[0.8rem] font-bold text-dark-text truncate">Project_Brief.pdf</p>
                <p className="text-[0.65rem] font-bold text-gray-400">Oct 26 · 2.4 MB</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-500"><i className="fas fa-file-word"></i></div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[0.8rem] font-bold text-dark-text truncate">Requirements.docx</p>
                <p className="text-[0.65rem] font-bold text-gray-400">Oct 25 · 1.1 MB</p>
              </div>
            </div>
          </div>
          <button className="w-full text-center text-orange-600 font-bold text-xs mt-3 hover:underline">View All Files</button>
        </div>
      </div>
    </div>
  );
}
